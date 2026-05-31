const { Produto } = require('../models');

exports.listar = async (_req, res) => res.json(await Produto.findAll({ order: [['nome', 'ASC']] }));
exports.criar = async (req, res) => {
  const { codigo, nome, precoVenda } = req.body;
  if (!codigo || !nome || Number(precoVenda) <= 0) return res.status(400).json({ erro: 'Código, nome e preço de venda são obrigatórios.' });
  const produto = await Produto.create(req.body);
  res.status(201).json(produto);
};
exports.atualizar = async (req, res) => {
  const produto = await Produto.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  await produto.update(req.body);
  res.json(produto);
};
exports.excluir = async (req, res) => {
  const produto = await Produto.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  await produto.destroy();
  res.json({ ok: true });
};
