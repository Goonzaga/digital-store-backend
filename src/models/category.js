const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'categories' });
