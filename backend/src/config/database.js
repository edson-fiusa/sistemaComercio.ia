const { Sequelize } = require('sequelize');
const path = require('path');

// Usamos o process.cwd() que aponta SEMPRE para a pasta raiz onde o projeto foi iniciado
const caminhoDoBanco = path.join(process.cwd(), 'database.sqlite');

console.log('===> FORÇANDO CONEXÃO SQLITE NO ARQUIVO:', caminhoDoBanco);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: caminhoDoBanco,
  logging: false
});

module.exports = sequelize;