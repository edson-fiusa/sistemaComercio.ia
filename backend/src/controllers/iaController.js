const { Venda, ItemVenda, Produto, Operador } = require('../models');
const { perguntarIA } = require('../services/iaService');

exports.perguntarSobreVendas = async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta) {
      return res.status(400).json({ erro: 'Digite uma pergunta.' });
    }

    const vendas = await Venda.findAll({
  order: [['createdAt', 'DESC']],
  limit: 200
});

    const dadosVendas = vendas.map(v => ({
  id: v.id,
  data: v.createdAt,
  total: v.total,
  formaPagamento: v.formaPagamento
}));

    const resposta = await perguntarIA(pergunta, dadosVendas);

    res.json({ resposta });

    } catch (error) {
    console.error('ERRO IA COMPLETO:', error);

    res.status(500).json({
      erro: 'Erro ao consultar IA.',
      detalhe: error.message
    })}}