const bcrypt = require('bcryptjs');

const { Operador } = require('../models');

require('dotenv').config();


// =====================================================
// LOGIN ADMINISTRADOR
// =====================================================

exports.loginAdmin = async (req, res) => {
  try {
    const { senha } = req.body;

    if (!senha) {
      return res.status(400).json({
        erro: 'Digite a senha do administrador.'
      });
    }

    if (senha !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        erro: 'Senha de administrador incorreta.'
      });
    }

    return res.json({
      ok: true,
      tipo: 'admin'
    });

  } catch (error) {
    console.error('Erro no login administrativo:', error);

    return res.status(500).json({
      erro: 'Erro ao realizar login administrativo.',
      detalhe: error.message
    });
  }
};


// =====================================================
// LOGIN OPERADOR DE CAIXA
// =====================================================

exports.loginCaixa = async (req, res) => {
  try {
    // O aplicativo envia usuario + senha
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({
        erro: 'Informe usuário e senha.'
      });
    }

    // Procura o operador pelo nome de usuário
    const operador = await Operador.findOne({
      where: {
        usuario: String(usuario)
          .trim()
          .toLowerCase()
      }
    });

    if (!operador) {
      return res.status(404).json({
        erro: 'Operador não encontrado.'
      });
    }

    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(
      String(senha),
      operador.senhaHash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'Senha do operador incorreta.'
      });
    }

    // Retorna os dados que o index.tsx espera
    return res.json({
      ok: true,
      operador: {
        id: operador.id,
        nome: operador.nome,
        usuario: operador.usuario
      }
    });

  } catch (error) {
    console.error(
      '❌ ERRO NO LOGIN DO CAIXA:',
      error
    );

    return res.status(500).json({
      erro: 'Erro ao realizar login do operador.',
      detalhe: error.message
    });
  }
};