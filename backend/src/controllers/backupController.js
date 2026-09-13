const fs = require('fs');
const path = require('path');

const { sequelize } = require('../models');


// ============================================================
// CAMINHO REAL DO BANCO
// ============================================================
//
// Usa exatamente o arquivo SQLite configurado no Sequelize.
// Isso evita o backup procurar database.sqlite em um local
// diferente do banco que o sistema realmente está usando.
// ============================================================

function obterCaminhoBanco() {
  const storage = sequelize.options.storage;

  if (!storage) {
    throw new Error(
      'O caminho do banco SQLite não está configurado no Sequelize.'
    );
  }

  if (storage === ':memory:') {
    throw new Error(
      'O banco está configurado como SQLite em memória. Não é possível realizar backup em arquivo.'
    );
  }

  return path.resolve(storage);
}


// ============================================================
// CAMINHOS DO BACKUP
// ============================================================

const BACKUP_DIR = path.join(
  __dirname,
  '..',
  'backups'
);

const BACKUP_PATH = path.join(
  BACKUP_DIR,
  'backup-semanal.sqlite'
);

const BACKUP_ANTES_RESTAURACAO = path.join(
  BACKUP_DIR,
  'backup-antes-da-restauracao.sqlite'
);

const INFO_PATH = path.join(
  BACKUP_DIR,
  'backup-info.json'
);


// ============================================================
// GARANTIR PASTA DE BACKUP
// ============================================================

function garantirPastaBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, {
      recursive: true
    });
  }
}


// ============================================================
// SALVAR INFORMAÇÕES DO BACKUP
// ============================================================

function salvarInfoBackup(data) {
  garantirPastaBackup();

  fs.writeFileSync(
    INFO_PATH,
    JSON.stringify(
      {
        data,
        arquivo: 'backup-semanal.sqlite'
      },
      null,
      2
    ),
    'utf8'
  );
}


// ============================================================
// LER INFORMAÇÕES DO BACKUP
// ============================================================

function lerInfoBackup() {
  if (!fs.existsSync(INFO_PATH)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        INFO_PATH,
        'utf8'
      )
    );
  } catch (error) {
    console.error(
      'Erro ao ler informações do backup:',
      error
    );

    return null;
  }
}


// ============================================================
// CONSULTAR BACKUP
// GET /backup
// ============================================================

async function listar(req, res) {
  try {
    garantirPastaBackup();

    const databasePath = obterCaminhoBanco();

    console.log(
      '📁 Banco SQLite utilizado pelo sistema:',
      databasePath
    );

    console.log(
      '📁 Backup semanal:',
      BACKUP_PATH
    );

    // --------------------------------------------------------
    // VERIFICA SE O BANCO EXISTE
    // --------------------------------------------------------

    const bancoExiste =
      fs.existsSync(databasePath);

    // --------------------------------------------------------
    // VERIFICA SE O BACKUP EXISTE
    // --------------------------------------------------------

    if (!fs.existsSync(BACKUP_PATH)) {
      return res.json({
        existe: false,
        bancoExiste,
        banco: path.basename(databasePath)
      });
    }

    // --------------------------------------------------------
    // INFORMAÇÕES DO BACKUP
    // --------------------------------------------------------

    const estatisticas =
      fs.statSync(BACKUP_PATH);

    const info =
      lerInfoBackup();

    return res.json({
      existe: true,

      bancoExiste,

      banco:
        path.basename(databasePath),

      data:
        info?.data ||
        estatisticas.mtime.toISOString(),

      arquivo:
        'backup-semanal.sqlite',

      tamanho:
        estatisticas.size
    });

  } catch (error) {

    console.error(
      '❌ Erro ao consultar backup:',
      error
    );

    return res.status(500).json({
      erro:
        error?.message ||
        'Não foi possível consultar o backup.'
    });
  }
}


// ============================================================
// CRIAR BACKUP
// POST /backup
// ============================================================

async function criar(req, res) {
  try {

    garantirPastaBackup();

    // --------------------------------------------------------
    // DESCOBRE O BANCO REAL
    // --------------------------------------------------------

    const databasePath =
      obterCaminhoBanco();

    console.log(
      '💾 Iniciando backup do banco:',
      databasePath
    );

    // --------------------------------------------------------
    // VERIFICA BANCO
    // --------------------------------------------------------

    if (!fs.existsSync(databasePath)) {

      console.error(
        '❌ Banco não encontrado:',
        databasePath
      );

      return res.status(404).json({
        erro:
          'Banco de dados não encontrado.',

        caminho:
          databasePath
      });
    }

    // --------------------------------------------------------
    // CHECKPOINT SQLITE
    // --------------------------------------------------------

    try {

      await sequelize.query(
        'PRAGMA wal_checkpoint(FULL)'
      );

    } catch (error) {

      console.log(
        '⚠️ Aviso no checkpoint SQLite:',
        error.message
      );
    }

    // --------------------------------------------------------
    // ARQUIVO TEMPORÁRIO
    // --------------------------------------------------------

    const backupTemporario =
      path.join(
        BACKUP_DIR,
        'backup-semanal-temp.sqlite'
      );

    if (
      fs.existsSync(
        backupTemporario
      )
    ) {
      fs.unlinkSync(
        backupTemporario
      );
    }

    // --------------------------------------------------------
    // CAMINHO PARA O SQLITE
    // --------------------------------------------------------

    const caminhoSqlite =
      backupTemporario
        .replace(/\\/g, '/')
        .replace(/'/g, "''");

    // --------------------------------------------------------
    // VACUUM INTO
    // --------------------------------------------------------

    console.log(
      '💾 Criando arquivo de backup:',
      backupTemporario
    );

    await sequelize.query(
      `VACUUM INTO '${caminhoSqlite}'`
    );

    // --------------------------------------------------------
    // VERIFICA SE O TEMPORÁRIO FOI CRIADO
    // --------------------------------------------------------

    if (
      !fs.existsSync(
        backupTemporario
      )
    ) {
      throw new Error(
        'O SQLite não criou o arquivo de backup.'
      );
    }

    // --------------------------------------------------------
    // REMOVE BACKUP ANTIGO
    // --------------------------------------------------------

    if (
      fs.existsSync(
        BACKUP_PATH
      )
    ) {
      fs.unlinkSync(
        BACKUP_PATH
      );
    }

    // --------------------------------------------------------
    // RENOMEIA TEMPORÁRIO
    // --------------------------------------------------------

    fs.renameSync(
      backupTemporario,
      BACKUP_PATH
    );

    // --------------------------------------------------------
    // DATA DO BACKUP
    // --------------------------------------------------------

    const data =
      new Date().toISOString();

    salvarInfoBackup(data);

    console.log(
      '✅ Backup realizado com sucesso!'
    );

    console.log(
      '📁 Arquivo:',
      BACKUP_PATH
    );

    return res.json({
      ok: true,

      mensagem:
        'Backup realizado com sucesso.',

      data,

      arquivo:
        'backup-semanal.sqlite',

      tamanho:
        fs.statSync(BACKUP_PATH).size
    });

  } catch (error) {

    console.error(
      '❌ Erro ao criar backup:',
      error
    );

    return res.status(500).json({
      erro:
        error?.message ||
        'Não foi possível realizar o backup.'
    });
  }
}


// ============================================================
// RESTAURAR BACKUP
// POST /backup/restaurar
// ============================================================

async function restaurar(req, res) {
  try {
    garantirPastaBackup();

    // ========================================================
    // VERIFICAR SE EXISTE BACKUP
    // ========================================================

    if (!fs.existsSync(BACKUP_PATH)) {
      return res.status(404).json({
        erro: 'Não existe nenhum backup para restaurar.'
      });
    }

    // ========================================================
    // CAMINHO DO BANCO REAL
    // ========================================================

    const databasePath = obterCaminhoBanco();

    console.log(
      '🔄 Banco atual:',
      databasePath
    );

    console.log(
      '🔄 Backup:',
      BACKUP_PATH
    );

    // ========================================================
    // VERIFICAR BANCO ATUAL
    // ========================================================

    if (!fs.existsSync(databasePath)) {
      return res.status(404).json({
        erro: 'Banco de dados atual não encontrado.',
        caminho: databasePath
      });
    }

    // ========================================================
    // 1. CRIAR BACKUP DE SEGURANÇA DO BANCO ATUAL
    // ========================================================

    const backupAtualTemp = path.join(
      BACKUP_DIR,
      'backup-antes-da-restauracao-temp.sqlite'
    );

    if (fs.existsSync(backupAtualTemp)) {
      fs.unlinkSync(backupAtualTemp);
    }

    try {
      await sequelize.query(
        'PRAGMA wal_checkpoint(FULL)'
      );
    } catch (error) {
      console.log(
        '⚠️ Aviso no checkpoint:',
        error.message
      );
    }

    const caminhoAtual = backupAtualTemp
      .replace(/\\/g, '/')
      .replace(/'/g, "''");

    await sequelize.query(
      `VACUUM INTO '${caminhoAtual}'`
    );

    if (fs.existsSync(BACKUP_ANTES_RESTAURACAO)) {
      fs.unlinkSync(
        BACKUP_ANTES_RESTAURACAO
      );
    }

    fs.renameSync(
      backupAtualTemp,
      BACKUP_ANTES_RESTAURACAO
    );

    console.log(
      '🛡️ Backup de segurança criado.'
    );

    // ========================================================
    // 2. FECHAR CONEXÕES
    // ========================================================

    await sequelize.close();

    console.log(
      '🔒 Conexão com banco encerrada.'
    );

    // ========================================================
    // 3. RESTAURAR ARQUIVO
    // ========================================================

    fs.copyFileSync(
      BACKUP_PATH,
      databasePath
    );

    console.log(
      '♻️ Backup copiado para o banco principal.'
    );

    // ========================================================
    // 4. IMPORTANTE:
    // NÃO USAR sequelize.authenticate() AQUI
    // ========================================================
    //
    // O close() encerra o connection manager.
    // O servidor precisa continuar usando uma conexão nova.
    //
    // Em vez de tentar reabrir o mesmo Sequelize fechado,
    // marcamos a restauração como concluída e deixamos o
    // servidor reiniciar a conexão normalmente.
    // ========================================================

    return res.json({
      ok: true,

      mensagem:
        'Backup restaurado com sucesso. Reinicie o servidor para carregar o banco restaurado.',

      reiniciarServidor: true
    });

  } catch (error) {

    console.error(
      '❌ Erro ao restaurar backup:',
      error
    );

    return res.status(500).json({
      erro:
        error?.message ||
        'Não foi possível restaurar o backup.'
    });
  }
}


// ============================================================
// EXPORTAÇÕES
// ============================================================

module.exports = {
  listar,
  criar,
  restaurar
};