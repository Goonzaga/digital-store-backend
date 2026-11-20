const { Category } = require('../models');
const { HttpError } = require('./errors');

const positiveInt = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

async function search(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(limit) || (limit !== -1 && limit < 1) || !Number.isInteger(page) || page < 1) throw new HttpError(400, 'Invalid pagination');
  const where = {};
  if (query.use_in_menu !== undefined) {
    if (!['true', 'false'].includes(String(query.use_in_menu))) throw new HttpError(400, 'Invalid use_in_menu');
    where.use_in_menu = String(query.use_in_menu) === 'true';
  }
  const attributes = query.fields ? ['id', ...String(query.fields).split(',').map((x) => x.trim()).filter((x) => ['name', 'slug', 'use_in_menu'].includes(x))] : undefined;
  const result = await Category.findAndCountAll({ where, attributes, limit: limit === -1 ? undefined : limit, offset: limit === -1 ? undefined : (page - 1) * limit, order: [['id', 'ASC']] });
  return { data: result.rows, total: result.count, limit, page };
}

async function get(id) {
  if (!positiveInt(id)) throw new HttpError(400, 'Invalid category id');
  const category = await Category.findByPk(id);
  if (!category) throw new HttpError(404, 'Category not found');
  return category;
}

async function create(data) {
  if (!data.name || !data.slug) throw new HttpError(400, 'Name and slug are required');
  return Category.create({ name: data.name, slug: data.slug, use_in_menu: data.use_in_menu ?? false });
}

async function update(id, data) {
  const category = await get(id);
  if (!data.name || !data.slug) throw new HttpError(400, 'Name and slug are required');
  await category.update({ name: data.name, slug: data.slug, use_in_menu: data.use_in_menu ?? false });
}

async function remove(id) { await (await get(id)).destroy(); }

module.exports = { search, get, create, update, remove };
