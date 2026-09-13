const {
Produto,
Avaria,
Entrada,
} = require('../models');

// =====================================================
// REGISTRAR ENTRADA
// =====================================================

exports.registrarEntrada = async (req, res) => {
try {
const {
produtoId,
quantidade,
precoCusto,
motivo,
} = req.body;


if (!produtoId) {
  return res.status(400).json({
    erro: 'Produto não informado.',
  });
}

const qtd = Number(quantidade);

if (!Number.isFinite(qtd) || qtd <= 0) {
  return res.status(400).json({
    erro: 'Quantidade inválida.',
  });
}

const produto = await Produto.findByPk(produtoId);

if (!produto) {
  return res.status(404).json({
    erro: 'Produto não encontrado.',
  });
}

await Entrada.create({
  produtoId,
  quantidade: qtd,
  precoCusto: Number(precoCusto || 0),
  motivo: motivo || 'Compra/Reposição',
});

await produto.update({
  quantidade:
    Number(produto.quantidade || 0) + qtd,
});

return res.status(201).json({
  ok: true,
  mensagem: 'Entrada registrada com sucesso.',
  produto,
});


} catch (error) {
console.error('Erro ao registrar entrada:', error);


return res.status(500).json({
  erro:
    error.message ||
    'Erro ao registrar entrada.',
});


}
};

// =====================================================
// REGISTRAR AVARIA
// =====================================================

exports.registrarAvaria = async (req, res) => {
try {
console.log('POST /avarias:', req.body);

const {
  produtoId,
  quantidade,
  motivo,
  observacao,
} = req.body;

if (!produtoId) {
  return res.status(400).json({
    erro: 'Produto não informado.',
  });
}

const qtd = Number(quantidade);

if (!Number.isFinite(qtd) || qtd <= 0) {
  return res.status(400).json({
    erro: 'Quantidade inválida.',
  });
}

if (!motivo || !motivo.trim()) {
  return res.status(400).json({
    erro: 'Informe o motivo da avaria.',
  });
}

const produto = await Produto.findByPk(produtoId);

if (!produto) {
  return res.status(404).json({
    erro: 'Produto não encontrado.',
  });
}

const estoqueAtual = Number(
  produto.quantidade || 0
);

if (qtd > estoqueAtual) {
  return res.status(400).json({
    erro:
      'A quantidade da avaria é maior que o estoque atual.',
  });
}

const precoCusto = Number(
  produto.precoEntrada || 0
);

const avaria = await Avaria.create({
  produtoId: produto.id,
  quantidade: qtd,
  motivo: motivo.trim(),
  observacao: observacao
    ? observacao.trim()
    : null,
  precoCusto,
});

await produto.update({
  quantidade: estoqueAtual - qtd,
});

return res.status(201).json({
  ok: true,
  mensagem: 'Avaria registrada com sucesso.',
  avaria,
  produto,
});


} catch (error) {
console.error('Erro ao registrar avaria:', error);

return res.status(500).json({
  erro:
    error.message ||
    'Erro ao registrar avaria.',
});


}
};

// =====================================================
// LISTAR AVARIAS
// =====================================================

exports.listarAvarias = async (_req, res) => {
try {
const avarias = await Avaria.findAll({
include: [
{
model: Produto,
as: 'produto',
},
],
order: [['createdAt', 'DESC']],
});


const resultado = avarias.map((avaria) => ({
  id: avaria.id,

  produtoId: avaria.produtoId,

  produtoNome:
    avaria.produto?.nome ||
    `Produto #${avaria.produtoId}`,

  codigo:
    avaria.produto?.codigo || '',

  quantidade: Number(
    avaria.quantidade || 0
  ),

  motivo: avaria.motivo,

  observacao:
    avaria.observacao || '',

  precoCusto: Number(
    avaria.precoCusto || 0
  ),

  data:
    avaria.createdAt ||
    avaria.data ||
    new Date(),
}));

return res.json(resultado);


} catch (error) {
console.error('Erro ao listar avarias:', error);

return res.status(500).json({
  erro:
    error.message ||
    'Erro ao listar avarias.',
});


}
};

// =====================================================
// EXCLUIR AVARIA
// =====================================================
//
// reporEstoque = true
//    Exclui a avaria e devolve a quantidade ao estoque.
//
// reporEstoque = false
//    Exclui a avaria definitivamente sem devolver estoque.
// =====================================================

exports.excluirAvaria = async (req, res) => {
try {
console.log('=================================');
console.log('EXCLUINDO AVARIA');
console.log('ID:', req.params.id);
console.log('BODY:', req.body);
console.log('=================================');


const id = req.params.id;

// Não força Number() para evitar problema
// caso o banco use outro tipo de ID.
if (!id) {
  return res.status(400).json({
    erro: 'ID da avaria não informado.',
  });
}

const avaria = await Avaria.findByPk(id);

if (!avaria) {
  return res.status(404).json({
    erro: 'Avaria não encontrada.',
  });
}

const reporEstoque =
  req.body?.reporEstoque === true ||
  req.body?.reporEstoque === 'true';

console.log(
  'Avaria encontrada:',
  avaria.toJSON()
);

console.log(
  'Repor estoque:',
  reporEstoque
);

// ==========================================
// REPOR ESTOQUE
// ==========================================

if (reporEstoque) {
  const produto = await Produto.findByPk(
    avaria.produtoId
  );

  if (!produto) {
    return res.status(404).json({
      erro:
        'O produto desta avaria não foi encontrado.',
    });
  }

  const estoqueAtual = Number(
    produto.quantidade || 0
  );

  const quantidadeAvaria = Number(
    avaria.quantidade || 0
  );

  console.log(
    'Estoque atual:',
    estoqueAtual
  );

  console.log(
    'Quantidade da avaria:',
    quantidadeAvaria
  );

  await produto.update({
    quantidade:
      estoqueAtual + quantidadeAvaria,
  });

  console.log(
    'Estoque reposto:',
    estoqueAtual + quantidadeAvaria
  );
}

// ==========================================
// EXCLUI A AVARIA
// ==========================================

await avaria.destroy();

console.log(
  'AVARIA EXCLUÍDA COM SUCESSO'
);

return res.json({
  ok: true,

  reposto: reporEstoque,

  mensagem: reporEstoque
    ? 'Avaria excluída e quantidade reposta no estoque.'
    : 'Avaria excluída permanentemente.',
});


} catch (error) {
console.error(
'================================='
);


console.error(
  'ERRO AO EXCLUIR AVARIA:'
);

console.error(error);

console.error(
  '================================='
);

return res.status(500).json({
  erro:
    error.message ||
    'Não foi possível excluir a avaria.',
});


}
};
