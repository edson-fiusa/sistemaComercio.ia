const {
  Caixa,
  Operador,
  Venda,
  ItemVenda,
  Produto
} = require('../models');


// =====================================================
// 1. LISTAR CAIXAS
// =====================================================

exports.listar = async (_req, res) => {
  try {
    const caixas = await Caixa.findAll({
      include: [
        {
          model: Operador,
          as: 'operador'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(
      caixas.map((c) => ({
        id: c.id,
        operadorId: c.operadorId,
        operadorNome:
          c.operador?.nome || 'Não informado',
        dataAbertura: c.createdAt,
        dataFechamento: c.dataFechamento,
        total: Number(c.total || 0),
        fechado: c.fechado
      }))
    );

  } catch (error) {
    console.error(
      'Erro ao listar caixas:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao listar caixas.',
      detalhe: error.message
    });
  }
};


// =====================================================
// 2. ABRIR CAIXA
// =====================================================

exports.abrir = async (req, res) => {
  try {
    const {
      operadorId,
      saldoInicial = 0
    } = req.body;

    if (!operadorId) {
      return res.status(400).json({
        erro: 'Informe o operador.'
      });
    }

    const operador =
      await Operador.findByPk(operadorId);

    if (!operador) {
      return res.status(404).json({
        erro: 'Operador não encontrado.'
      });
    }

    // Verifica se esse operador já possui
    // um caixa aberto
    const aberto =
      await Caixa.findOne({
        where: {
          operadorId,
          fechado: false
        }
      });

    if (aberto) {
      return res.json({
        caixaId: aberto.id,
        reaberto: true
      });
    }

    const caixa =
      await Caixa.create({
        operadorId,
        saldoInicial: Number(
          saldoInicial || 0
        )
      });

    res.status(201).json({
      caixaId: caixa.id
    });

  } catch (error) {
    console.error(
      'Erro ao abrir caixa:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao abrir caixa.',
      detalhe: error.message
    });
  }
};


// =====================================================
// 3. FECHAR CAIXA
// =====================================================

exports.fechar = async (req, res) => {
  try {
    const caixa =
      await Caixa.findByPk(
        req.params.id
      );

    if (!caixa) {
      return res.status(404).json({
        erro: 'Caixa não encontrado.'
      });
    }

    if (caixa.fechado) {
      return res.status(400).json({
        erro: 'Este caixa já está fechado.'
      });
    }

    const saldoFinal =
      Number(
        req.body.saldoFinal ??
        caixa.total ??
        0
      );

    await caixa.update({
      fechado: true,
      saldoFinal,
      dataFechamento: new Date()
    });

    res.json({
      ok: true,
      caixaId: caixa.id,
      saldoFinal
    });

  } catch (error) {
    console.error(
      'Erro ao fechar caixa:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao fechar caixa.',
      detalhe: error.message
    });
  }
};


// =====================================================
// 4. LISTAR VENDAS DE UM CAIXA
// =====================================================

exports.listarVendasDoCaixa = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const itens =
      await ItemVenda.findAll({
        include: [
          {
            model: Venda,
            as: 'venda',
            where: {
              caixaId: id
            },
            attributes: [
              'id',
              'caixaId',
              'operadorId',
              'total',
              'formaPagamento',
              'valorPago',
              'troco',
              'mercadoPagoId',
              'createdAt'
            ]
          },

          {
            model: Produto,
            as: 'produto',
            attributes: [
              'id',
              'nome',
              'codigo'
            ]
          }
        ],

        order: [
          ['createdAt', 'DESC']
        ]
      });

    const resposta =
      itens.map((item) => {
        const produto =
          item.produto;

        const venda =
          item.venda;

        return {
          vendaId:
            item.vendaId,

          produtoId:
            item.produtoId,

          produtoNome:
            produto?.nome ||
            'Produto Removido',

          produtoCodigo:
            produto?.codigo ||
            '',

          quantidade:
            Number(
              item.quantidade || 0
            ),

          precoUnitario:
            Number(
              item.precoUnitario || 0
            ),

          subtotal:
            Number(
              item.subtotal || 0
            ),

          formaPagamento:
            venda?.formaPagamento ||
            '',

          vendaTotal:
            Number(
              venda?.total || 0
            ),

          valorPago:
            Number(
              venda?.valorPago || 0
            ),

          troco:
            Number(
              venda?.troco || 0
            ),

          dataVenda:
            venda?.createdAt ||
            item.createdAt
        };
      });

    return res.json(
      resposta
    );

  } catch (error) {
    console.error(
      'ERRO AO BUSCAR ITENS DO CAIXA:',
      error
    );

    return res.status(500).json({
      erro:
        'Erro ao buscar detalhamento de produtos do caixa.',
      detalhe:
        error.message
    });
  }
};