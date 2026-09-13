const bcrypt = require('bcryptjs');

const { Operador } = require('../models');

// =====================================================
// LOGIN ADMINISTRADOR
// =====================================================

exports.loginAdmin = async (req, res) => {
try {
const { senha } = req.body;

if (!senha) {
  return res.status(400).json({
    erro: 'Digite a senha do administrador.',
  });
}

if (senha !== process.env.ADMIN_PASSWORD) {
  return res.status(401).json({
    erro: 'Senha de administrador incorreta.',
  });
}

return res.json({
  ok: true,
  tipo: 'admin',
});


} catch (error) {
console.error(
'Erro no login administrativo:',
error
);

return res.status(500).json({
  erro: 'Erro ao realizar login.',
});


}
};

// =====================================================
// LOGIN OPERADOR DE CAIXA
// =====================================================

exports.loginCaixa = async (req, res) => {
try {
console.log(
'POST /auth/caixa:',
req.body
);


const {
  usuario,
  senha,
} = req.body;

if (!usuario || !senha) {
  return res.status(400).json({
    erro: 'Informe usuário e senha.',
  });
}

// Procura o operador pelo nome de usuário
const operador = await Operador.findOne({
  where: {
    usuario: usuario.trim(),
  },
});

if (!operador) {
  return res.status(404).json({
    erro: 'Operador não encontrado.',
  });
}

// Confere a senha
const senhaCorreta = await bcrypt.compare(
  senha,
  operador.senhaHash
);

if (!senhaCorreta) {
  return res.status(401).json({
    erro: 'Senha do operador incorreta.',
  });
}

console.log(
  'Login do operador realizado:',
  operador.usuario
);

return res.json({
  ok: true,

  operador: {
    id: operador.id,
    nome: operador.nome,
    usuario: operador.usuario,
  },

  id: operador.id,
  nome: operador.nome,
  usuario: operador.usuario,
});


} catch (error) {
console.error(
'Erro no login do caixa:',
error
);

return res.status(500).json({
  erro:
    error.message ||
    'Erro ao realizar login do caixa.',
});


}
};
