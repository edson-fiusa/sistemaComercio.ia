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
    const alertasEstoqueParaDisparar = [];
    
    // 🟢 BLINDAGEM DO PIX PARA TESTES LOCAIS:
    // Se for Pix e não tiver o token configurado no .env, injetamos um ID fictício para não quebrar o banco
    let idPagamentoPix = mercadoPagoId;
    if (String(formaPagamento).toLowerCase() === 'pix' && !process.env.MP_ACCESS_TOKEN) {
      console.log("⚠️ MP_ACCESS_TOKEN NÃO CONFIGURADO! SIMULANDO PIX LOCAL PARA TESTES...");
      idPagamentoPix = idPagamentoPix || `TESTE-PIX-${Date.now()}`;
    }

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

        const novaQuantidade = Number(produto.quantidade) - qtd;

        await produto.update(
          {
            quantidade: novaQuantidade
          },
          { transaction: t }
        );

        // 🟢 CAPTURA O ESTOQUE MÍNIMO: Verifica se bateu o limite
        const estoqueMinimo = Number(produto.estoqueMinimo || 0);
        if (novaQuantidade <= estoqueMinimo) {
          alertasEstoqueParaDisparar.push({
            id: produto.id,
            nome: produto.nome,
            quantidadeAtual: novaQuantidade,
            estoqueMinimo: estoqueMinimo
          });
        }

        itensVenda.push({
          produtoId: produto.id,
          quantidade: qtd,
          precoUnitario: preco,
          subtotal
        });
      }

      const troco =
        String(formaPagamento).toLowerCase() === 'dinheiro'
          ? Math.max(Number(valorPago) - total, 0)
          : 0;

      if (String(formaPagamento).toLowerCase() === 'dinheiro' && Number(valorPago) < total) {
        throw new Error('Valor recebido menor que o total.');
      }

      const venda = await Venda.create(
        {
          caixaId: caixa.id,
          operadorId: caixa.operadorId,
          total,
          formaPagamento: String(formaPagamento).toLowerCase(),
          valorPago: String(formaPagamento).toLowerCase() === 'dinheiro' ? valorPago : total,
          troco,
          mercadoPagoId: idPagamentoPix // Salva o ID real ou o nosso ID de teste local
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

    if (req.io && alertasEstoqueParaDisparar.length > 0) {
      alertasEstoqueParaDisparar.forEach((alerta) => {
        console.log(`⚠️ SOCKET EMITIDO: ${alerta.nome} com estoque em ${alerta.quantidadeAtual}`);
        req.io.emit('alertaEstoqueBaixo', alerta);
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      erro: error.message || 'Erro ao finalizar venda.'
    });
  }
};