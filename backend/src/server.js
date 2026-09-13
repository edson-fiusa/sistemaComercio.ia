require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 

const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app); 


const io = new Server(server, {
  cors: {
    origin: "*", // 🟢 LIBERAÇÃO SUPREMA: Permite que qualquer porta local (5173 ou 127.0.0.1) se conecte ao rádio
    methods: ['GET', 'POST'],
    credentials: false
  }
});
app.use(cors({ origin: '*' }));
app.use(express.json());

// 🚨 COMPORTAMENTO CRÍTICO CORRIGIDO: Injeta o 'io' ANTES de carregar as rotas do sistema
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Agora as rotas conseguem usar o 'req.io' perfeitamente
app.use(routes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor rodando em tempo real na porta ${PORT}`);
    console.log('Senha admin carregada:', process.env.ADMIN_PASSWORD ? 'SIM' : 'NÃO');
  });
}).catch(err => {
  console.error("Erro crítico ao sincronizar banco:", err);
});