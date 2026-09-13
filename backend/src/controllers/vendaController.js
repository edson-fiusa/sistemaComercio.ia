const {
  sequelize,
  Produto,
  Caixa,
  Venda,
  ItemVenda
} = require('../models');


// ============================================================
// CRIAR VENDA
// ============================================================

exports.criar = async (req, res) => {
  const {
    caixaId,
    formaPagamento,
    itens,
    valorPago = 0,
    mercadoPagoId
  } = req.body;

  if (
    !caixaId ||
    !formaPagamento ||
    !Array.isArray(itens) ||
    itens.length === 0
  ) {
    return res.status(400).json({
      erro: 'Caixa, forma de pagamento e itens são obrigatórios.'
    });
  }

  try {
    const alertasEstoqueParaDisparar = [];

    // ========================================================
    // BLINDAGEM DO PIX PARA TESTES LOCAIS
    // ========================================================

    let idPagamentoPix = mercadoPagoId;

    if (
      String(formaPagamento).toLowerCase() === 'pix' &&
      !process.env.MP_ACCESS_TOKEN
    ) {
      console.log(
        '⚠️ MP_ACCESS_TOKEN NÃO CONFIGURADO! SIMULANDO PIX LOCAL PARA TESTES...'
      );

      idPagamentoPix =
        idPagamentoPix || `TESTE-PIX-${Date.now()}`;
    }

    // ========================================================
    // TRANSAÇÃO
    // ========================================================

    const result = await sequelize.transaction(async (t) => {

      // ------------------------------------------------------
      // LOCALIZA O CAIXA
      // ------------------------------------------------------

      const caixa = await Caixa.findByPk(caixaId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!caixa || caixa.fechado) {
        throw new Error(
          'Caixa inexistente ou fechado.'
        );
      }

      let total = 0;

      const itensVenda = [];

      // ======================================================
      // PROCESSA OS PRODUTOS
      // ======================================================

      for (const item of itens) {

        const produto = await Produto.findByPk(
          item.produtoId,
          {
            transaction: t,
            lock: t.LOCK.UPDATE
          }
        );

        if (!produto) {
          throw new Error(
            'Produto não encontrado.'
          );
        }

        const qtd = Number(item.quantidade);

        if (!qtd || qtd <= 0) {
          throw new Error(
            `Quantidade inválida para o produto: ${produto.nome}`
          );
        }

        // ----------------------------------------------------
        // VERIFICA ESTOQUE
        // ----------------------------------------------------

        if (
          Number(produto.quantidade) < qtd
        ) {
          throw new Error(
            `Estoque insuficiente: ${produto.nome}`
          );
        }

        // ----------------------------------------------------
        // CALCULA PREÇO
        // ----------------------------------------------------

        const preco =
          Number(produto.precoVenda);

        const subtotal =
          preco * qtd;

        total += subtotal;

        // ----------------------------------------------------
        // ATUALIZA ESTOQUE
        // ----------------------------------------------------

        const novaQuantidade =
          Number(produto.quantidade) - qtd;

        await produto.update(
          {
            quantidade: novaQuantidade
          },
          {
            transaction: t
          }
        );

        // ----------------------------------------------------
        // VERIFICA ESTOQUE MÍNIMO
        // ----------------------------------------------------

        const estoqueMinimo =
          Number(produto.estoqueMinimo || 0);

        if (
          novaQuantidade <= estoqueMinimo
        ) {
          alertasEstoqueParaDisparar.push({
            id: produto.id,
            nome: produto.nome,
            quantidadeAtual: novaQuantidade,
            estoqueMinimo: estoqueMinimo
          });
        }

        // ----------------------------------------------------
        // GUARDA ITEM DA VENDA
        // ----------------------------------------------------

        itensVenda.push({
          produtoId: produto.id,
          quantidade: qtd,
          precoUnitario: preco,
          subtotal: subtotal
        });
      }

      // ======================================================
      // TROCO
      // ======================================================

      const pagamento =
        String(formaPagamento).toLowerCase();

      const troco =
        pagamento === 'dinheiro'
          ? Math.max(
              Number(valorPago) - total,
              0
            )
          : 0;

      // ======================================================
      // VERIFICA DINHEIRO
      // ======================================================

      if (
        pagamento === 'dinheiro' &&
        Number(valorPago) < total
      ) {
        throw new Error(
          'Valor recebido menor que o total.'
        );
      }

      // ======================================================
      // CRIA VENDA
      // ======================================================

      const venda = await Venda.create(
        {
          caixaId: caixa.id,
          operadorId: caixa.operadorId,
          total: total,
          formaPagamento: pagamento,

          valorPago:
            pagamento === 'dinheiro'
              ? Number(valorPago)
              : total,

          troco: troco,

          mercadoPagoId:
            idPagamentoPix
        },
        {
          transaction: t
        }
      );

      // ======================================================
      // CRIA ITENS DA VENDA
      // ======================================================

      for (const iv of itensVenda) {

        await ItemVenda.create(
          {
            ...iv,
            vendaId: venda.id
          },
          {
            transaction: t
          }
        );
      }

      // ======================================================
      // ATUALIZA TOTAL DO CAIXA
      // ======================================================

      await caixa.update(
        {
          total:
            Number(caixa.total || 0) +
            total
        },
        {
          transaction: t
        }
      );

      // ======================================================
      // RETORNO DA TRANSAÇÃO
      // ======================================================

      return {
        vendaId: venda.id,
        total: total,
        troco: troco
      };
    });

    // ========================================================
    // DISPARA ALERTAS DE ESTOQUE
    // ========================================================

    if (
      req.io &&
      alertasEstoqueParaDisparar.length > 0
    ) {

      alertasEstoqueParaDisparar.forEach(
        (alerta) => {

          console.log(
            `⚠️ SOCKET EMITIDO: ${alerta.nome} com estoque em ${alerta.quantidadeAtual}`
          );

          req.io.emit(
            'alertaEstoqueBaixo',
            alerta
          );
        }
      );
    }

    // ========================================================
    // RESPOSTA
    // ========================================================

    return res.status(201).json(result);

  } catch (error) {

    console.error(
      'Erro ao criar venda:',
      error
    );

    return res.status(500).json({
      erro:
        error.message ||
        'Erro ao finalizar venda.'
    });
  }
};


// ============================================================
// LISTAR VENDAS
// GET /vendas
// ============================================================
//
// Essa função é usada pelo:
// src/app/relatorios.tsx
//
// Retorna:
// - venda
// - caixa
// - operadorId
// - itens
// - produto de cada item
//
// ============================================================

exports.listar = async (req, res) => {

  try {

    const vendas = await Venda.findAll({

      // Mais recentes primeiro
      order: [
        ['createdAt', 'DESC']
      ],

      include: [

        // ====================================================
        // CAIXA
        // ====================================================

        {
          model: Caixa,
          as: 'caixa',

          attributes: [
            'id',
            'operadorId',
            'saldoInicial',
            'saldoFinal',
            'total',
            'fechado',
            'dataFechamento'
          ]
        },

        // ====================================================
        // ITENS DA VENDA
        // ====================================================

        {
          model: ItemVenda,
          as: 'itens',

          include: [

            // ================================================
            // PRODUTO DO ITEM
            // ================================================

            {
              model: Produto,
              as: 'produto',

              attributes: [
                'id',
                'codigo',
                'nome',
                'unidade'
              ]
            }
          ]
        }
      ]
    });

    console.log(
      `📊 Relatório: ${vendas.length} vendas encontradas.`
    );

    return res.json(vendas);

  } catch (error) {

    console.error(
      '❌ Erro ao listar vendas:',
      error
    );

    return res.status(500).json({
      erro:
        error.message ||
        'Erro ao carregar vendas.'
    });
  }
};