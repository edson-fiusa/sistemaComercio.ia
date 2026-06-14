const router = require('express').Router();
const auth = require('../controllers/authController');
const produtos = require('../controllers/produtoController');
const operadores = require('../controllers/operadorController');
const caixas = require('../controllers/caixaController');
const vendas = require('../controllers/vendaController');
const estoque = require('../controllers/estoqueController');
const pagamentos = require('../controllers/pagamentoController');

const iaRoutes = require('./iaRoutes');
router.use(iaRoutes);

// Autenticação
router.post('/auth/admin', auth.loginAdmin);
router.post('/auth/caixa', auth.loginCaixa);

// Produtos
router.get('/produtos', produtos.listar);
router.post('/produtos', produtos.criar);
router.put('/produtos/:id', produtos.atualizar);
router.delete('/produtos/:id', produtos.excluir);

// Operadores
router.get('/operadores', operadores.listar);
router.post('/operadores', operadores.criar);
router.put('/operadores/:id', operadores.atualizar);
router.delete('/operadores/:id', operadores.excluir);

// Caixas
router.get('/caixas', caixas.listar);
router.post('/caixas/abrir', caixas.abrir);
router.put('/caixas/:id/fechar', caixas.fechar);
router.get('/caixas/:id/vendas', caixas.listarVendasDoCaixa); 

// Vendas e Estoque
router.post('/vendas', vendas.criar);
router.post('/entradas', estoque.registrarEntrada);
router.post('/avarias', estoque.registrarAvaria);
router.get('/avarias', estoque.listarAvarias);

// Pagamentos
router.post('/pagamentos/pix', pagamentos.criarPix);
router.get('/pagamentos/:id', pagamentos.consultar);

module.exports = router;