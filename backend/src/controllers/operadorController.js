
const bcrypt = require('bcryptjs');

const { Operador } = require('../models');

const limpar = (op) => ({
  id: op.id,
  nome: op.nome,
  usuario: op.usuario,
  dataCadastro: op.createdAt,
});

exports.listar = async (_req, res) => {
  try {
    const operadores = await Operador.findAll({
      order: [['nome', 'ASC']],
    });

    res.json(operadores.map(limpar));
  } catch (error) {
    console.error('Erro ao listar operadores:', error);

    res.status(500).json({
      erro: error.message || 'Erro ao listar operadores.',
    });
  }
};

exports.criar = async (req, res) => {
  try {
    const { nome, usuario, senha } = req.body;

    if (!nome || !usuario || !senha || senha.length < 4) {
      return res.status(400).json({
        erro: 'Nome, usuário e senha com mínimo 4 caracteres são obrigatórios.',
      });
    }

    const existente = await Operador.findOne({
      where: { usuario },
    });

    if (existente) {
      return res.status(400).json({
        erro: 'Este usuário já está cadastrado.',
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const op = await Operador.create({
      nome,
      usuario,
      senhaHash,
    });

    res.status(201).json(limpar(op));
  } catch (error) {
    console.error('Erro ao criar operador:', error);

    res.status(500).json({
      erro: error.message || 'Erro ao criar operador.',
    });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const op = await Operador.findByPk(req.params.id);

    if (!op) {
      return res.status(404).json({
        erro: 'Operador não encontrado.',
      });
    }

    const { nome, usuario, senha } = req.body;

    if (!nome || !usuario) {
      return res.status(400).json({
        erro: 'Nome e usuário são obrigatórios.',
      });
    }

    const outro = await Operador.findOne({
      where: { usuario },
    });

    if (outro && outro.id !== op.id) {
      return res.status(400).json({
        erro: 'Este usuário já está cadastrado.',
      });
    }

    const dados = {
      nome,
      usuario,
    };

    // Só altera a senha se uma nova senha for informada
    if (senha) {
      if (senha.length < 4) {
        return res.status(400).json({
          erro: 'A senha deve ter no mínimo 4 caracteres.',
        });
      }

      dados.senhaHash = await bcrypt.hash(senha, 10);
    }

    await op.update(dados);

    res.json(limpar(op));
  } catch (error) {
    console.error('Erro ao atualizar operador:', error);

    res.status(500).json({
      erro: error.message || 'Erro ao atualizar operador.',
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    const op = await Operador.findByPk(req.params.id);

    if (!op) {
      return res.status(404).json({
        erro: 'Operador não encontrado.',
      });
    }

    await op.destroy();

    res.json({
      ok: true,
      mensagem: 'Operador excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir operador:', error);

    res.status(500).json({
      erro: error.message || 'Erro ao excluir operador.',
    });
  }
};

