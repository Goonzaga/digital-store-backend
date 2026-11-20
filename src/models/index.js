const sequelize = require('../config/database');

const User = require('./user')(sequelize);
const Category = require('./category')(sequelize);
const Product = require('./product')(sequelize);
const ProductImage = require('./product-image')(sequelize);
const ProductOption = require('./product-option')(sequelize);
const ProductCategory = require('./product-category')(sequelize);

Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id', otherKey: 'category_id', as: 'categories' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id', otherKey: 'product_id', as: 'products' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory };
