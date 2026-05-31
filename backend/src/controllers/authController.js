const bcrypt = require('bcryptjs');
const { Operador } = require('../models');

exports.loginAdmin = async (req, res) => {
  const { senha } = req.body;
  if (!senha) return res.status(400).json({ erro: 'Digite a senha do administrador.' });
  if (senha !== process.env.ADMIN_PASSWORD) return res.status(401).json({ erro: 'Senha de administrador incorreta.' });
  res.json({ ok: true, tipo: 'admin' });
};

exports.loginCaixa = async (req, res) => {
  const { operadorId, senha } = req.body;
  if (!operadorId || !senha) return res.status(400).json({ erro: 'Informe operador e senha.' });
  const operador = await Operador.findByPk(operadorId);
  if (!operador) return res.status(404).json({ erro: 'Operador não encontrado.' });
  const ok = await bcrypt.compare(senha, operador.senhaHash);
  if (!ok) return res.status(401).json({ erro: 'Senha do operador incorreta.' });
  res.json({ id: operador.id, nome: operador.nome, usuario: operador.usuario });
};
