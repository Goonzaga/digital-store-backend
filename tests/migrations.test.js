const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

describe('database migrations', () => {
  test('defines all required tables and foreign key relationships', async () => {
    const directory = path.join(__dirname, '..', 'src', 'migrations');
    const files = fs.readdirSync(directory).filter((file) => file.endsWith('.js')).sort();
    const created = [];
    const queryInterface = { createTable: jest.fn(async (name, schema) => created.push({ name, schema })) };
    for (const file of files) await require(path.join(directory, file)).up(queryInterface, Sequelize);

    expect(created.map((table) => table.name)).toEqual([
      'users', 'categories', 'products', 'product_images', 'product_options', 'product_categories',
    ]);
    expect(created.find((table) => table.name === 'product_images').schema.product_id.references.model).toBe('products');
    expect(created.find((table) => table.name === 'product_options').schema.product_id.references.model).toBe('products');
    expect(created.find((table) => table.name === 'product_categories').schema.category_id.references.model).toBe('categories');
  });
});
