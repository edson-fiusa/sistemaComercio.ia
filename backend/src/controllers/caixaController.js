
const { Caixa, Operador } = require('../models');

exports.listar = async (_req, res) => {
  try {
    const caixas = await Caixa.findAll({
      include: [
        {
          model: Operador,
          as: 'operador',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(
      caixas.map((c) => ({
        id: c.id,
        operadorId: c.operadorId,
        operadorNome: c.operador?.nome || 'Não informado',
        dataAbertura: c.createdAt,
        dataFechamento: c.dataFechamento,
        saldoInicial: Number(c.saldoInicial || 0),
        saldoFinal: Number(c.saldoFinal || 0),
        total: Number(c.total || 0),
        fechado: c.fechado,
      }))
    );
  } catch (error) {
    console.error('Erro ao listar caixas:', error);

    res.status(500).json({
      erro: 'Erro ao listar caixas.',
      detalhe: error.message,
    });
  }
};

exports.abrir = async (req, res) => {
  try {
    const { operadorId, saldoInicial = 0 } = req.body;

    if (!operadorId) {
      return res.status(400).json({
        erro: 'Informe o operador.',
      });
    }

    const operador = await Operador.findByPk(operadorId);

    if (!operador) {
      return res.status(404).json({
        erro: 'Operador não encontrado.',
      });
    }

    // Verifica se esse operador já possui um caixa aberto
    const aberto = await Caixa.findOne({
      where: {
        operadorId,
        fechado: false,
      },
      include: [
        {
          model: Operador,
          as: 'operador',
        },
      ],
    });

    if (aberto) {
      return res.json({
        id: aberto.id,
        caixaId: aberto.id,
        operadorId: aberto.operadorId,
        operadorNome: aberto.operador?.nome || operador.nome,
        saldoInicial: Number(aberto.saldoInicial || 0),
        total: Number(aberto.total || 0),
        fechado: false,
        reaberto: true,
      });
    }

    const caixa = await Caixa.create({
      operadorId,
      saldoInicial: Number(saldoInicial) || 0,
      saldoFinal: 0,
      total: 0,
      fechado: false,
    });

    res.status(201).json({
      id: caixa.id,
      caixaId: caixa.id,
      operadorId: caixa.operadorId,
      operadorNome: operador.nome,
      saldoInicial: Number(caixa.saldoInicial || 0),
      total: Number(caixa.total || 0),
      fechado: false,
      reaberto: false,
    });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);

    res.status(500).json({
      erro: 'Erro ao abrir caixa.',
      detalhe: error.message,
    });
  }
};

exports.fechar = async (req, res) => {
  try {
    const caixa = await Caixa.findByPk(req.params.id);

    if (!caixa) {
      return res.status(404).json({
        erro: 'Caixa não encontrado.',
      });
    }

    if (caixa.fechado) {
      return res.status(400).json({
        erro: 'Este caixa já está fechado.',
      });
    }

    const saldoFinal =
      req.body?.saldoFinal !== undefined
        ? Number(req.body.saldoFinal)
        : Number(caixa.total || 0);

    await caixa.update({
      fechado: true,
      saldoFinal,
      dataFechamento: new Date(),
    });

    res.json({
      ok: true,
      caixaId: caixa.id,
      saldoFinal,
      mensagem: 'Caixa fechado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);

    res.status(500).json({
      erro: 'Erro ao fechar caixa.',
      detalhe: error.message,
    });
  }
};

