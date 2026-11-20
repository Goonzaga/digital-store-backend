const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ProductCategory', {
  product_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  category_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
}, { tableName: 'product_categories', timestamps: false });
