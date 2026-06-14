    const express = require('express');
    const router = express.Router();
    const iaController = require('../controllers/iaController');

    router.post('/ia/vendas', iaController.perguntarSobreVendas);

    module.exports = router;