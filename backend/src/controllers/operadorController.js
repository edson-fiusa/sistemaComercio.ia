const bcrypt = require('bcryptjs');
const { Operador } = require('../models');

const limpar = op => ({ id: op.id, nome: op.nome, usuario: op.usuario, dataCadastro: op.createdAt });
exports.listar = async (_req, res) => res.json((await Operador.findAll({ order: [['nome','ASC']] })).map(limpar));
exports.criar = async (req, res) => {
  const { nome, usuario, senha } = req.body;
  if (!nome || !usuario || !senha || senha.length < 4) return res.status(400).json({ erro: 'Nome, usuário e senha com mínimo 4 caracteres são obrigatórios.' });
  const senhaHash = await bcrypt.hash(senha, 10);
  const op = await Operador.create({ nome, usuario, senhaHash });
  res.status(201).json(limpar(op));
};
exports.excluir = async (req, res) => {
  const op = await Operador.findByPk(req.params.id);
  if (!op) return res.status(404).json({ erro: 'Operador não encontrado.' });
  await op.destroy();
  res.json({ ok: true });
};
