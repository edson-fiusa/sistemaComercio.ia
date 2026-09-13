require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
});

// CORS
app.use(
  cors({
    origin: '*',
  })
);

// JSON
app.use(express.json());

// Disponibiliza o Socket.IO para as rotas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rotas
app.use(routes);

const PORT = process.env.PORT || 3000;

// Banco + servidor
sequelize
  .sync({ force: false })
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('======================================');
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log('Acesso pela rede: http://0.0.0.0:' + PORT);
      console.log('======================================');
      console.log(
        'Senha admin carregada:',
        process.env.ADMIN_PASSWORD ? 'SIM' : 'NÃO'
      );
    });
  })
  .catch((err) => {
    console.error('Erro crítico ao sincronizar banco:', err);
  });