const { Produto, Avaria, Entrada } = require('../models');

exports.registrarEntrada = async (req, res) => {
  const { produtoId, quantidade, precoCusto = 0, motivo } = req.body;
  const produto = await Produto.findByPk(produtoId);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  await Entrada.create({ ProdutoId: produto.id, quantidade, precoCusto, motivo });
  await produto.update({ quantidade: Number(produto.quantidade) + Number(quantidade), precoEntrada: precoCusto });
  res.status(201).json({ ok: true });
};

exports.registrarAvaria = async (req, res) => {
  const { produtoId, quantidade, motivo, observacao } = req.body;
  const produto = await Produto.findByPk(produtoId);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  if (Number(produto.quantidade) < Number(quantidade)) return res.status(400).json({ erro: 'Quantidade maior que o estoque atual.' });
  const avaria = await Avaria.create({ ProdutoId: produto.id, quantidade, motivo, observacao, precoCusto: Number(produto.precoEntrada) * Number(quantidade) });
  await produto.update({ quantidade: Number(produto.quantidade) - Number(quantidade) });
  res.status(201).json(avaria);
};

exports.listarAvarias = async (_req, res) => {
  const avarias = await Avaria.findAll({ include: Produto, order: [['createdAt','DESC']] });
  res.json(avarias.map(a => ({ id:a.id, produtoId:a.ProdutoId, produtoNome:a.Produto?.nome, quantidade:Number(a.quantidade), motivo:a.motivo, observacao:a.observacao, precoCusto:Number(a.precoCusto), data:a.createdAt })));
};
