const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

const STATUS_FINAIS_ERRO = ['cancelled', 'rejected', 'refunded', 'charged_back'];
function paymentClient() {
  if (!process.env.MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN não configurado no .env');
  return new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }));
}

exports.criarPix = async (req, res) => {
  const { valor, descricao = 'Venda PDV', nome = 'Cliente', email = 'cliente@email.com', caixaId } = req.body;
  if (!caixaId) return res.status(400).json({ erro: 'Caixa não identificado.' });
  if (!valor || Number(valor) <= 0) return res.status(400).json({ erro: 'Valor inválido para PIX.' });
  try {
    const payment = await paymentClient().create({ body: {
      transaction_amount: Number(valor),
      description: descricao,
      payment_method_id: 'pix',
      payer: { email, first_name: nome },
      external_reference: String(caixaId)
    }});
    res.status(201).json({
      mercadoPagoId: payment.id,
      status: payment.status,
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (e) {
    res.status(500).json({ erro: e.message || 'Erro ao gerar PIX.' });
  }
};

exports.consultar = async (req, res) => {
  try {
    const payment = await paymentClient().get({ id: req.params.id });
    res.json({ status: payment.status, aprovado: payment.status === 'approved', erroFinal: STATUS_FINAIS_ERRO.includes(payment.status) });
  } catch (e) {
    res.status(500).json({ erro: e.message || 'Erro ao consultar PIX.' });
  }
};
