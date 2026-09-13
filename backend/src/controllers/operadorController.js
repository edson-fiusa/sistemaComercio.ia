const { Operador } = require('../models');

// 🟢 1. LISTAR OPERADORES
exports.listar = async (req, res) => {
  try {
    const operadores = await Operador.findAll({ order: [['nome', 'ASC']] });
    return res.json(operadores);
  } catch (error) {
    console.error("❌ ERRO AO LISTAR OPERADORES:", error);
    return res.status(500).json({ erro: 'Erro ao buscar operadores.' });
  }
};

// 🟢 2. CRIAR OPERADOR
exports.criar = async (req, res) => {
  try {
    // Pegamos as informações enviadas pelo formulário do front-end
    const { nome, login, usuario, senha } = req.body;

    // Garante compatibilidade: aceita tanto se vier como 'login' ou 'usuario'
    const loginFinal = String(login || usuario || '').trim().toLowerCase();

    if (!nome || !loginFinal || !senha) {
      return res.status(400).json({ erro: 'Nome, usuário e senha são obrigatórios.' });
    }

    // 🌟 Alinhado com o seu banco: usa 'usuario' e 'senhaHash' exigidos pelo Sequelize
    const operador = await Operador.create({
      nome: String(nome).trim(),
      usuario: loginFinal,         // Preenche o campo 'usuario' do banco
      senhaHash: String(senha),    // Preenche o campo 'senhaHash' do banco
      perfil: 'caixa',
      ativo: true
    });

    return res.status(201).json(operador);
  } catch (error) {
    console.error("❌ ERRO AO CRIAR OPERADOR:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ erro: 'Este usuário já está sendo utilizado por outro operador.' });
    }
    return res.status(500).json({ erro: 'Erro ao salvar operador.', detalhe: error.message });
  }
};

// 🟢 3. ATUALIZAR OPERADOR
exports.atualizar = async (req, res) => {
  try {
    const operador = await Operador.findByPk(req.params.id);
    if (!operador) {
      return res.status(404).json({ erro: 'Operador não encontrado.' });
    }

    const { nome, login, usuario, senha, ativo } = req.body;
    const loginFinal = login || usuario;

    if (nome !== undefined) operador.nome = String(nome).trim();
    
    // 🌟 Alinhado com o seu banco: atualiza 'usuario' se enviado
    if (loginFinal !== undefined) {
      operador.usuario = String(loginFinal).trim().toLowerCase();
    }
    
    if (ativo !== undefined) operador.ativo = Boolean(ativo);
    
    // 🌟 Alinhado com o seu banco: atualiza 'senhaHash' se digitado
    if (senha && String(senha).trim() !== "") {
      operador.senhaHash = String(senha);
    }

    await operador.save();
    return res.json(operador);
  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR OPERADOR:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ erro: 'Este usuário já está em uso.' });
    }
    return res.status(500).json({ erro: 'Erro ao atualizar operador.', detalhe: error.message });
  }
};

// 🟢 4. EXCLUIR OPERADOR
exports.excluir = async (req, res) => {
  try {
    const operador = await Operador.findByPk(req.params.id);
    if (!operador) {
      return res.status(404).json({ erro: 'Operador não encontrado.' });
    }

    await operador.destroy();
    return res.json({ ok: true, mensagem: 'Operador removido com sucesso.' });
  } catch (error) {
    console.error("❌ ERRO AO EXCLUIR OPERADOR:", error);
    return res.status(500).json({ erro: 'Erro ao excluir operador.' });
  }
};