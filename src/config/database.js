const { Sequelize } = require('sequelize');

const required = ['DB_NAME', 'DB_USER', 'DB_HOST'];
if (process.env.NODE_ENV !== 'test') {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing database environment variables: ${missing.join(', ')}`);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'digital_store_test',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
  },
);

module.exports = sequelize;
