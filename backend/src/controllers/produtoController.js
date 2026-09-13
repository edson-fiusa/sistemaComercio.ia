const { Produto } = require('../models');

/**

* LISTAR PRODUTOS
* GET /produtos
  */
  exports.listar = async (_req, res) => {
  try {
  const produtos = await Produto.findAll({
  order: [['nome', 'ASC']]
  });

  console.log(`Produtos encontrados: ${produtos.length}`);

  return res.status(200).json(produtos);
  } catch (error) {
  console.error('Erro ao listar produtos:', error);

  return res.status(500).json({
  erro: error.message || 'Erro ao listar produtos.'
  });
  }
  };

/**

* CRIAR PRODUTO
* POST /produtos
  */
  exports.criar = async (req, res) => {
  try {
  const {
  codigo,
  nome,
  precoVenda
  } = req.body;

  if (!codigo || !String(codigo).trim()) {
  return res.status(400).json({
  erro: 'O código do produto é obrigatório.'
  });
  }

  if (!nome || !String(nome).trim()) {
  return res.status(400).json({
  erro: 'O nome do produto é obrigatório.'
  });
  }

  if (
  precoVenda === undefined ||
  precoVenda === null ||
  Number(precoVenda) <= 0
  ) {
  return res.status(400).json({
  erro: 'O preço de venda deve ser maior que zero.'
  });
  }

  const produtoExistente = await Produto.findOne({
  where: {
  codigo: String(codigo).trim()
  }
  });

  if (produtoExistente) {
  return res.status(400).json({
  erro: 'Já existe um produto cadastrado com este código.'
  });
  }

  const dadosProduto = {
  ...req.body,
  codigo: String(codigo).trim(),
  nome: String(nome).trim(),
  precoVenda: Number(precoVenda),
  precoEntrada: Number(req.body.precoEntrada || 0),
  quantidade: Number(req.body.quantidade || 0),
  estoqueMinimo: Number(req.body.estoqueMinimo || 0)
  };

  if (dadosProduto.ean) {
  dadosProduto.ean = String(dadosProduto.ean).trim();
  }

  const produto = await Produto.create(dadosProduto);

  console.log('Produto criado:', produto.id, produto.nome);

  return res.status(201).json(produto);
  } catch (error) {
  console.error('Erro ao criar produto:', error);

  return res.status(500).json({
  erro: error.message || 'Erro ao criar produto.'
  });
  }
  };

/**

* ATUALIZAR PRODUTO
* PUT /produtos/:id
  */
  exports.atualizar = async (req, res) => {
  try {
  const produto = await Produto.findByPk(req.params.id);

  if (!produto) {
  return res.status(404).json({
  erro: 'Produto não encontrado.'
  });
  }

  const dados = {
  ...req.body
  };

  if (dados.codigo !== undefined) {
  dados.codigo = String(dados.codigo).trim();

  if (!dados.codigo) {
  return res.status(400).json({
  erro: 'O código do produto é obrigatório.'
  });
  }

  const outroProduto = await Produto.findOne({
  where: {
  codigo: dados.codigo
  }
  });

  if (
  outroProduto &&
  Number(outroProduto.id) !== Number(produto.id)
  ) {
  return res.status(400).json({
  erro: 'Já existe outro produto com este código.'
  });
  }
  }

  if (dados.nome !== undefined) {
  dados.nome = String(dados.nome).trim();

  if (!dados.nome) {
  return res.status(400).json({
  erro: 'O nome do produto é obrigatório.'
  });
  }
  }

  if (dados.precoVenda !== undefined) {
  const precoVenda = Number(dados.precoVenda);

  if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
  return res.status(400).json({
  erro: 'O preço de venda deve ser maior que zero.'
  });
  }

  dados.precoVenda = precoVenda;
  }

  if (dados.precoEntrada !== undefined) {
  dados.precoEntrada = Number(dados.precoEntrada || 0);
  }

  if (dados.quantidade !== undefined) {
  dados.quantidade = Number(dados.quantidade || 0);
  }

  if (dados.estoqueMinimo !== undefined) {
  dados.estoqueMinimo = Number(dados.estoqueMinimo || 0);
  }

  if (dados.ean !== undefined && dados.ean !== null) {
  dados.ean = String(dados.ean).trim();
  }

  await produto.update(dados);

  console.log('Produto atualizado:', produto.id, produto.nome);

  return res.status(200).json(produto);
  } catch (error) {
  console.error('Erro ao atualizar produto:', error);

  return res.status(500).json({
  erro: error.message || 'Erro ao atualizar produto.'
  });
  }
  };

/**

* EXCLUIR PRODUTO
* DELETE /produtos/:id
  */
  exports.excluir = async (req, res) => {
  try {
  const produto = await Produto.findByPk(req.params.id);

  if (!produto) {
  return res.status(404).json({
  erro: 'Produto não encontrado.'
  });
  }

  await produto.destroy();

  console.log('Produto excluído:', produto.id, produto.nome);

  return res.status(200).json({
  ok: true,
  mensagem: 'Produto excluído com sucesso.'
  });
  } catch (error) {
  console.error('Erro ao excluir produto:', error);

  return res.status(500).json({
  erro: error.message || 'Erro ao excluir produto.'
  });
  }
  };
