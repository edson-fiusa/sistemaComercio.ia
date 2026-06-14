const { Produto, Avaria, Entrada } = require('../models');

// 🟢 1. REGISTRAR ENTRADA DE ESTOQUE
exports.registrarEntrada = async (req, res) => {
  try {
    const { produtoId, quantidade, precoCusto = 0, motivo } = req.body;

    const produto = await Produto.findByPk(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    // Corrigido para utilizar minúsculo (produtoId) compatível com o mapeamento SQLite
    await Entrada.create({ 
      produtoId: produto.id, 
      quantidade: Number(quantidade), 
      precoCusto: Number(precoCusto), 
      motivo: motivo || 'Entrada manual' 
    });

    await produto.update({ 
      quantidade: Number(produto.quantidade || 0) + Number(quantidade), 
      precoEntrada: Number(precoCusto) 
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("❌ ERRO AO REGISTRAR ENTRADA NO SQLITE:", error);
    return res.status(500).json({ erro: 'Erro ao registrar entrada de estoque.', detalhe: error.message });
  }
};

// 🟢 2. REGISTRAR PRODUTO AVARIADO
exports.registrarAvaria = async (req, res) => {
  try {
    const { produtoId, quantidade, motivo, observacao } = req.body;

    const produto = await Produto.findByPk(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    if (Number(produto.quantidade || 0) < Number(quantidade)) {
      return res.status(400).json({ erro: 'Quantidade maior que o estoque atual.' });
    }

    const custoCalculado = Number(produto.precoEntrada || 0) * Number(quantidade);

    // Corrigido para usar produtoId em minúsculo e evitar quebra de chave estrangeira no SQLite
    const avaria = await Avaria.create({ 
      produtoId: produto.id, 
      quantidade: Number(quantidade), 
      motivo, 
      observacao: observacao || '', 
      precoCusto: custoCalculado 
    });

    await produto.update({ 
      quantidade: Number(produto.quantidade || 0) - Number(quantidade) 
    });

    return res.status(201).json(avaria);
  } catch (error) {
    console.error("❌ ERRO AO REGISTRAR AVARIA NO SQLITE:", error);
    return res.status(500).json({ erro: 'Erro ao salvar o produto avariado.', detalhe: error.message });
  }
};

// 🟢 3. LISTAR PRODUTOS AVARIADOS (Tratado com Include Seguro)
exports.listarAvarias = async (_req, res) => {
  try {
    // Faz o include do Produto com alias padrão do Sequelize
    const avarias = await Avaria.findAll({ 
      include: [{ model: Produto, as: 'produto' }], // Garante o mapeamento correto do relacionamento
      order: [['createdAt', 'DESC']] 
    });

    // Mapeia os dados limpando para o Front-end ler sem travar
    const resultadoFormatado = avarias.map(a => {
      // Tenta capturar o produto de forma segura pelas duas propriedades possíveis
      const infoProduto = a.produto || a.Produto;

      return { 
        id: a.id, 
        produtoId: a.produtoId || a.ProdutoId, 
        produtoNome: infoProduto ? infoProduto.nome : 'Produto Não Identificado', 
        quantidade: Number(a.quantidade || 0), 
        motivo: a.motivo || 'Não informado', 
        observacao: a.observacao || '', 
        precoCusto: Number(a.precoCusto || 0), 
        data: a.createdAt 
      };
    });

    return res.json(resultadoFormatado);
  } catch (error) {
    console.error("❌ ERRO AO LISTAR AVARIAS NO SQLITE:", error);
    return res.status(500).json({ erro: 'Erro ao buscar lista de avarias.', detalhe: error.message });
  }
};