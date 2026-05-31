// backend/src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    api: true
  });
});

app.use(cors());
app.use(express.json());

app.use(routes);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Senha admin carregada:', process.env.ADMIN_PASSWORD ? 'SIM' : 'NÃO');
  });
});