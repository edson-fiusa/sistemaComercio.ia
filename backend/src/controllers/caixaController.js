const { Caixa, Operador } = require('../models');
exports.listar = async (_req, res) => {
  const caixas = await Caixa.findAll({ include: Operador, order: [['createdAt','DESC']] });
  res.json(caixas.map(c => ({ id:c.id, operadorId:c.OperadorId, operadorNome:c.Operador?.nome, dataAbertura:c.createdAt, dataFechamento:c.dataFechamento, total:Number(c.total), fechado:c.fechado })));
};
exports.abrir = async (req, res) => {
  const { operadorId, saldoInicial = 0 } = req.body;
  const aberto = await Caixa.findOne({ where: { OperadorId: operadorId, fechado: false } });
  if (aberto) return res.json({ caixaId: aberto.id, reaberto: true });
  const caixa = await Caixa.create({ OperadorId: operadorId, saldoInicial });
  res.status(201).json({ caixaId: caixa.id });
};
exports.fechar = async (req, res) => {
  const caixa = await Caixa.findByPk(req.params.id);
  if (!caixa) return res.status(404).json({ erro: 'Caixa não encontrado.' });
  await caixa.update({ fechado: true, saldoFinal: req.body.saldoFinal || caixa.total, dataFechamento: new Date() });
  res.json({ ok: true });
};
