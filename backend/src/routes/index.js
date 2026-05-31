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

router.post('/auth/admin', auth.loginAdmin);
router.post('/auth/caixa', auth.loginCaixa);



router.get('/produtos', produtos.listar);
router.post('/produtos', produtos.criar);
router.put('/produtos/:id', produtos.atualizar);
router.delete('/produtos/:id', produtos.excluir);

router.get('/operadores', operadores.listar);
router.post('/operadores', operadores.criar);
router.delete('/operadores/:id', operadores.excluir);

router.get('/caixas', caixas.listar);
router.post('/caixas/abrir', caixas.abrir);
router.put('/caixas/:id/fechar', caixas.fechar);

router.post('/vendas', vendas.criar);
router.post('/entradas', estoque.registrarEntrada);
router.post('/avarias', estoque.registrarAvaria);
router.get('/avarias', estoque.listarAvarias);

router.post('/pagamentos/pix', pagamentos.criarPix);
router.get('/pagamentos/:id', pagamentos.consultar);

module.exports = router;
