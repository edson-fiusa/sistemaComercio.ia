const { Produto } = require('../models');

// 🟢 1. LISTAR PRODUTOS
exports.listar = async (req, res) => {
  try {
    const produtos = await Produto.findAll({ 
      order: [['nome', 'ASC']] 
    });
    return res.json(produtos);
  } catch (error) {
    console.error("❌ ERRO AO LISTAR PRODUTOS:", error);
    return res.status(500).json({ erro: 'Erro ao buscar produtos.', detalhe: error.message });
  }
};

// 🟢 2. CRIAR PRODUTO
exports.criar = async (req, res) => {
  try {
    const { codigo, nome, precoVenda, precoEntrada, unidade, quantidade, estoqueMinimo, categoria } = req.body;

    if (!codigo || !nome || Number(precoVenda) <= 0) {
      return res.status(400).json({ erro: 'Código, nome e preço de venda válido são obrigatórios.' });
    }

    const dadosTratados = {
      codigo: String(codigo).trim(),
      nome: String(nome).trim(),
      precoVenda: Number(precoVenda),
      precoEntrada: precoEntrada !== "" && precoEntrada !== null ? Number(precoEntrada) : 0,
      unidade: unidade && unidade.trim() !== "" ? unidade : 'unidade',
      quantidade: quantidade !== "" && quantidade !== null ? Number(quantidade) : 0,
      estoqueMinimo: estoqueMinimo !== "" && estoqueMinimo !== null ? Number(estoqueMinimo) : 0,
      categoria: categoria && categoria.trim() !== "" ? categoria : 'Geral',
      ativo: true
    };

    const produto = await Produto.create(dadosTratados);
    return res.status(201).json(produto);

  } catch (error) {
    console.error("❌ ERRO AO CADASTRAR PRODUTO NO SQLITE:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ erro: 'Já existe um produto cadastrado com este código de barras.' });
    }
    return res.status(500).json({ erro: 'Erro interno ao salvar o produto.', detalhe: error.message });
  }
};

// 🟢 3. ATUALIZAR PRODUTO (Sintaxe corrigida para o Sequelize)
exports.atualizar = async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    const { codigo, nome, precoVenda, precoEntrada, unidade, quantidade, estoqueMinimo, categoria, ativo } = req.body;

    // Fazemos as atribuições de forma isolada e segura
    if (codigo !== undefined) produto.codigo = String(codigo).trim();
    if (nome !== undefined) produto.nome = String(nome).trim();
    if (precoVenda !== undefined) produto.precoVenda = Number(precoVenda);
    if (precoEntrada !== undefined) produto.precoEntrada = precoEntrada !== "" && precoEntrada !== null ? Number(precoEntrada) : 0;
    if (unidade !== undefined) produto.unidade = unidade && unidade.trim() !== "" ? unidade : 'unidade';
    if (quantidade !== undefined) produto.quantidade = quantidade !== "" && quantidade !== null ? Number(quantidade) : 0;
    if (estoqueMinimo !== undefined) produto.estoqueMinimo = estoqueMinimo !== "" && estoqueMinimo !== null ? Number(estoqueMinimo) : 0;
    if (categoria !== undefined) produto.categoria = categoria && categoria.trim() !== "" ? categoria : 'Geral';
    if (ativo !== undefined) produto.ativo = Boolean(ativo);

    // Salva as alterações no SQLite de fato
    await produto.save();
    return res.json(produto);

  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR PRODUTO:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ erro: 'Este código de barras já está sendo usado por outro produto.' });
    }
    return res.status(500).json({ erro: 'Erro ao atualizar o produto.', detalhe: error.message });
  }
};

// 🟢 4. EXCLUIR PRODUTO
exports.excluir = async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await produto.destroy();
    return res.json({ ok: true, mensagem: 'Produto removido com sucesso.' });

  } catch (error) {
    console.error("❌ ERRO AO EXCLUIR PRODUTO:", error);
    return res.status(500).json({ erro: 'Erro ao excluir o produto.', detalhe: error.message });
  }
};