const router = require('express').Router();

const auth = require('../controllers/authController');
const produtos = require('../controllers/produtoController');
const operadores = require('../controllers/operadorController');
const caixas = require('../controllers/caixaController');
const vendas = require('../controllers/vendaController');
const estoque = require('../controllers/estoqueController');
const pagamentos = require('../controllers/pagamentoController');
const backup = require('../controllers/backupController');

const iaRoutes = require('./iaRoutes');


// ============================================================
// IA
// ============================================================

router.use(iaRoutes);


// ============================================================
// AUTENTICAÇÃO
// ============================================================

router.post(
  '/auth/admin',
  auth.loginAdmin
);

router.post(
  '/auth/caixa',
  auth.loginCaixa
);


// ============================================================
// PRODUTOS
// ============================================================

router.get(
  '/produtos',
  produtos.listar
);

router.post(
  '/produtos',
  produtos.criar
);

router.put(
  '/produtos/:id',
  produtos.atualizar
);

router.delete(
  '/produtos/:id',
  produtos.excluir
);


// ============================================================
// OPERADORES
// ============================================================

router.get(
  '/operadores',
  operadores.listar
);

router.post(
  '/operadores',
  operadores.criar
);

router.put(
  '/operadores/:id',
  operadores.atualizar
);

router.delete(
  '/operadores/:id',
  operadores.excluir
);


// ============================================================
// CAIXAS
// ============================================================

router.get(
  '/caixas',
  caixas.listar
);

router.post(
  '/caixas/abrir',
  caixas.abrir
);

router.put(
  '/caixas/:id/fechar',
  caixas.fechar
);

router.get(
  '/caixas/:id/vendas',
  caixas.listarVendasDoCaixa
);


// ============================================================
// VENDAS
// ============================================================

// Registrar venda
router.post(
  '/vendas',
  vendas.criar
);

// Listar vendas para o relatório
router.get(
  '/vendas',
  vendas.listar
);


// ============================================================
// ESTOQUE
// ============================================================

// Registrar entrada
router.post(
  '/entradas',
  estoque.registrarEntrada
);

// Registrar avaria
router.post(
  '/avarias',
  estoque.registrarAvaria
);

// Listar avarias
router.get(
  '/avarias',
  estoque.listarAvarias
);


// ============================================================
// PAGAMENTOS
// ============================================================

router.post(
  '/pagamentos/pix',
  pagamentos.criarPix
);

router.get(
  '/pagamentos/:id',
  pagamentos.consultar
);


// ============================================================
// BACKUP
// ============================================================

// Consultar último backup
router.get(
  '/backup',
  backup.listar
);

// Criar backup
router.post(
  '/backup',
  backup.criar
);

// Restaurar backup
router.post(
  '/backup/restaurar',
  backup.restaurar
);


// ============================================================
// EXPORTAÇÃO
// ============================================================

module.exports = router;