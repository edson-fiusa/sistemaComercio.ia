const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = sequelize.define('Produto', {
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  nome: { type: DataTypes.STRING, allowNull: false },
  precoEntrada: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  precoVenda: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unidade: { type: DataTypes.STRING, defaultValue: 'unidade' },
  quantidade: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  estoqueMinimo: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  categoria: { type: DataTypes.STRING, defaultValue: 'Geral' },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Operador = sequelize.define('Operador', {
  nome: { type: DataTypes.STRING, allowNull: false },
  usuario: { type: DataTypes.STRING, unique: true, allowNull: false },
  senhaHash: { type: DataTypes.STRING, allowNull: false },
});

const Caixa = sequelize.define('Caixa', {
  saldoInicial: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  saldoFinal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  fechado: { type: DataTypes.BOOLEAN, defaultValue: false },
  dataFechamento: { type: DataTypes.DATE },
});

const Venda = sequelize.define('Venda', {
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  formaPagamento: { type: DataTypes.STRING, allowNull: false },
  valorPago: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  troco: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  mercadoPagoId: { type: DataTypes.STRING },
});

const ItemVenda = sequelize.define('ItemVenda', {
  quantidade: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  precoUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

const Avaria = sequelize.define('Avaria', {
  quantidade: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  motivo: { type: DataTypes.STRING, allowNull: false },
  observacao: { type: DataTypes.TEXT },
  precoCusto: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

const Entrada = sequelize.define('Entrada', {
  quantidade: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  precoCusto: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  motivo: { type: DataTypes.STRING, defaultValue: 'Compra/Reposição' },
});

// RELACIONAMENTOS
Operador.hasMany(Caixa, {
  foreignKey: 'operadorId',
  as: 'caixas'
});

Caixa.belongsTo(Operador, {
  foreignKey: 'operadorId',
  as: 'operador'
});

Caixa.hasMany(Venda, {
  foreignKey: 'caixaId',
  as: 'vendas'
});

Venda.belongsTo(Caixa, {
  foreignKey: 'caixaId',
  as: 'caixa'
});

// AQUI está a correção para a IA
Operador.hasMany(Venda, {
  foreignKey: 'operadorId',
  as: 'vendas'
});

Venda.belongsTo(Operador, {
  foreignKey: 'operadorId',
  as: 'operador'
});

Venda.hasMany(ItemVenda, {
  foreignKey: 'vendaId',
  as: 'itens'
});

ItemVenda.belongsTo(Venda, {
  foreignKey: 'vendaId',
  as: 'venda'
});

Produto.hasMany(ItemVenda, {
  foreignKey: 'produtoId',
  as: 'itensVenda'
});

ItemVenda.belongsTo(Produto, {
  foreignKey: 'produtoId',
  as: 'produto'
});

Produto.hasMany(Avaria, {
  foreignKey: 'produtoId',
  as: 'avarias'
});

Avaria.belongsTo(Produto, {
  foreignKey: 'produtoId',
  as: 'produto'
});

Produto.hasMany(Entrada, {
  foreignKey: 'produtoId',
  as: 'entradas'
});

Entrada.belongsTo(Produto, {
  foreignKey: 'produtoId',
  as: 'produto'
});

module.exports = {
  sequelize,
  Produto,
  Operador,
  Caixa,
  Venda,
  ItemVenda,
  Avaria,
  Entrada
};