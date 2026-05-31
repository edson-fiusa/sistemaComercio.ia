const { Caixa, Operador } = require('../models');

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