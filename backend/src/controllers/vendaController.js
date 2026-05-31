const { sequelize, Produto, Caixa, Venda, ItemVenda } = require('../models');

exports.criar = async (req, res) => {
  const {
    caixaId,
    formaPagamento,
    itens,
    valorPago = 0,
    mercadoPagoId
  } = req.body;

  if (!caixaId || !formaPagamento || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      erro: 'Caixa, forma de pagamento e itens são obrigatórios.'
    });
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      const caixa = await Caixa.findByPk(caixaId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!caixa || caixa.fechado) {
        throw new Error('Caixa inexistente ou fechado.');
      }

      let total = 0;
      const itensVenda = [];

      for (const item of itens) {
        const produto = await Produto.findByPk(item.produtoId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!produto) {
          throw new Error('Produto não encontrado.');
        }

        const qtd = Number(item.quantidade);

        if (Number(produto.quantidade) < qtd) {
          throw new Error(`Estoque insuficiente: ${produto.nome}`);
        }

        const preco = Number(produto.precoVenda);
        const subtotal = preco * qtd;

        total += subtotal;

        await produto.update(
          {
            quantidade: Number(produto.quantidade) - qtd
          },
          { transaction: t }
        );

        itensVenda.push({
          produtoId: produto.id,
          quantidade: qtd,
          precoUnitario: preco,
          subtotal
        });
      }

      const troco =
        formaPagamento === 'dinheiro'
          ? Math.max(Number(valorPago) - total, 0)
          : 0;

      if (formaPagamento === 'dinheiro' && Number(valorPago) < total) {
        throw new Error('Valor recebido menor que o total.');
      }

      const venda = await Venda.create(
        {
          caixaId: caixa.id,
          operadorId: caixa.operadorId,
          total,
          formaPagamento,
          valorPago,
          troco,
          mercadoPagoId
        },
        { transaction: t }
      );

      for (const iv of itensVenda) {
        await ItemVenda.create(
          {
            ...iv,
            vendaId: venda.id
          },
          { transaction: t }
        );
      }

      await caixa.update(
        {
          total: Number(caixa.total || 0) + total
        },
        { transaction: t }
      );

      return {
        vendaId: venda.id,
        total,
        troco
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar venda:', error);

    res.status(500).json({
      erro: error.message || 'Erro ao finalizar venda.'
    });
  }
};