const {
  Venda,
  ItemVenda,
  Produto,
  Operador,
  Caixa,
} = require('../models');

const { perguntarIA } = require('../services/iaService');

exports.perguntarSobreVendas = async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta || !pergunta.trim()) {
      return res.status(400).json({
        erro: 'Digite uma pergunta.',
      });
    }

    // =========================
    // VENDAS
    // =========================
    const vendas = await Venda.findAll({
      include: [
        {
          model: Caixa,
          as: 'caixa',
          include: [
            {
              model: Operador,
              as: 'operador',
              attributes: ['id', 'nome', 'usuario'],
            },
          ],
        },
        {
          model: ItemVenda,
          as: 'itens',
          include: [
            {
              model: Produto,
              as: 'produto',
              attributes: [
                'id',
                'codigo',
                'nome',
                'precoVenda',
                'quantidade',
                'estoqueMinimo',
                'categoria',
                'unidade',
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    const dadosVendas = vendas.map((venda) => ({
      id: venda.id,
      data: venda.createdAt,
      total: Number(venda.total || 0),
      formaPagamento: venda.formaPagamento,
      valorPago: Number(venda.valorPago || 0),
      troco: Number(venda.troco || 0),

      caixaId: venda.caixaId || null,

      operador: venda.caixa?.operador
        ? {
            id: venda.caixa.operador.id,
            nome: venda.caixa.operador.nome,
          }
        : null,

      itens: (venda.itens || []).map((item) => ({
        produtoId: item.produtoId,
        codigo: item.produto?.codigo || '',
        nome: item.produto?.nome || 'Produto não encontrado',
        quantidade: Number(item.quantidade || 0),
        precoUnitario: Number(item.precoUnitario || 0),
        subtotal: Number(item.subtotal || 0),
      })),
    }));

    // =========================
    // PRODUTOS / ESTOQUE
    // =========================
    const produtos = await Produto.findAll({
      order: [['nome', 'ASC']],
    });

    const dadosProdutos = produtos.map((produto) => ({
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      categoria: produto.categoria,
      unidade: produto.unidade,

      precoVenda: Number(produto.precoVenda || 0),

      quantidade: Number(produto.quantidade || 0),

      estoqueMinimo: Number(produto.estoqueMinimo || 0),

      ativo: produto.ativo,
    }));

    // =========================
    // DADOS GERAIS
    // =========================
    const dados = {
      vendas: dadosVendas,
      produtos: dadosProdutos,
      dataConsulta: new Date(),
    };

    // =========================
    // IA
    // =========================
    const resposta = await perguntarIA(pergunta.trim(), dados);

    return res.json({
      resposta,
    });

  } catch (error) {
    console.error('ERRO IA COMPLETO:', error);

    return res.status(500).json({
      erro: 'Erro ao consultar IA.',
      detalhe: error.message,
    });
  }
};