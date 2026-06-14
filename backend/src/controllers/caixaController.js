const { Caixa, Operador, Venda, ItemVenda, Produto } = require('../models');

// 🟢 1. LISTAR CAIXAS
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
        operadorNome: c.operador?.nome || 'Não informado',
        dataAbertura: c.createdAt,
        dataFechamento: c.dataFechamento,
        total: Number(c.total || 0),
        fechado: c.fechado
      }))
    );
  } catch (error) {
    console.error('Erro ao listar caixas:', error);
    res.status(500).json({
      erro: 'Erro ao listar caixas.',
      detalhe: error.message
    });
  }
};

// 🟢 2. ABRIR CAIXA
exports.abrir = async (req, res) => {
  try {
    const { operadorId, saldoInicial = 0 } = req.body;

    if (!operadorId) {
      return res.status(400).json({
        erro: 'Informe o operador.'
      });
    }

    const operador = await Operador.findByPk(operadorId);

    if (!operador) {
      return res.status(404).json({
        erro: 'Operador não encontrado.'
      });
    }

    const aberto = await Caixa.findOne({
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

    const caixa = await Caixa.create({
      operadorId,
      saldoInicial
    });

    res.status(201).json({
      caixaId: caixa.id
    });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({
      erro: 'Erro ao abrir caixa.',
      detalhe: error.message
    });
  }
};

// 🟢 3. FECHAR CAIXA
exports.fechar = async (req, res) => {
  try {
    const caixa = await Caixa.findByPk(req.params.id);

    if (!caixa) {
      return res.status(404).json({
        erro: 'Caixa não encontrado.'
      });
    }

    await caixa.update({
      fechado: true,
      saldoFinal: req.body.saldoFinal || caixa.total,
      dataFechamento: new Date()
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({
      erro: 'Erro ao fechar caixa.',
      detalhe: error.message
    });
  }
};
// 🟢 4. BUSCAR TODAS AS VENDAS E PRODUTOS DE UM CAIXA ESPECÍFICO (CORRIGIDO COM ALIAS)
exports.listarVendasDoCaixa = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscamos todos os itens de venda vinculados a esse caixaId
    const itens = await ItemVenda.findAll({
      include: [
        {
          model: Venda,
          as: 'venda', // 🌟 Adicionado o alias em minúsculo exigido pelo seu Sequelize
          where: { caixaId: id }, // Filtra apenas as vendas correspondentes a este turno de caixa
          attributes: [] 
        },
        {
          model: Produto,
          as: 'produto', // Alias padrão para o relacionamento com produto
          attributes: ['nome', 'codigo']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Mapeamos os dados com tratamento de nulos para o front-end ler em segurança
    const respostaFormatada = itens.map(item => {
      const pro = item.produto || item.Produto;

      return {
        vendaId: item.vendaId,
        produtoNome: pro ? pro.nome : 'Produto Removido',
        quantidade: Number(item.quantidade || 0),
        precoUnitario: Number(item.precoUnitario || 0)
      };
    });

    return res.json(respostaFormatada);
  } catch (error) {
    // 💡 SE O ALIAS FOR COM A PRIMEIRA LETRA MAIÚSCULA, FAZEMOS UM FALLBACK AUTOMÁTICO SEGURO:
    if (error.name === 'SequelizeEagerLoadingError') {
      try {
        const itensFallback = await ItemVenda.findAll({
          include: [
            {
              model: Venda,
              as: 'Venda', // 🌟 Tenta com V maiúsculo caso o modelo use esse padrão
              where: { caixaId: id },
              attributes: []
            },
            {
              model: Produto,
              as: 'Produto',
              attributes: ['nome', 'codigo']
            }
          ],
          order: [['createdAt', 'DESC']]
        });

        const respostaFallback = itensFallback.map(item => {
          const pro = item.Produto || item.produto;
          return {
            vendaId: item.vendaId,
            produtoNome: pro ? pro.nome : 'Produto Removido',
            quantidade: Number(item.quantidade || 0),
            precoUnitario: Number(item.precoUnitario || 0)
          };
        });

        return res.json(respostaFallback);
      } catch (err2) {
        console.error("❌ ERRO NO RETORNO RESERVA DO CAIXA:", err2);
      }
    }

    console.error("❌ ERRO AO BUSCAR ITENS DO CAIXA:", error);
    return res.status(500).json({ 
      erro: 'Erro ao buscar detalhamento de produtos do caixa.', 
      detalhe: error.message 
    });
  }
};