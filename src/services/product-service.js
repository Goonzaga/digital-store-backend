const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const { Product, Category, ProductImage, ProductOption, sequelize } = require('../models');
const { HttpError } = require('./errors');

const mediaRoot = path.resolve(process.cwd(), 'uploads');
const productAttributes = ['id', 'enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount'];

function validId(id) { return /^\d+$/.test(String(id)) && Number(id) > 0; }
function productIncludes() {
  return [
    { model: Category, as: 'categories', through: { attributes: [] } },
    { model: ProductImage, as: 'images' },
    { model: ProductOption, as: 'options' },
  ];
}
function toResponse(product, fields) {
  const raw = product.toJSON();
  const output = Object.fromEntries(productAttributes.map((key) => [key, raw[key]]));
  output.category_ids = (raw.categories || []).map((category) => category.id);
  output.images = (raw.images || []).map((image) => ({ id: image.id, content: image.path }));
  output.options = (raw.options || []).map((option) => ({
    id: option.id, title: option.title, shape: option.shape, radius: option.radius,
    type: option.type, values: option.values.split(',').filter(Boolean),
  }));
  if (fields) {
    const allowed = new Set(['id', ...fields.split(',').map((field) => field.trim())]);
    return Object.fromEntries(Object.entries(output).filter(([key]) => allowed.has(key)));
  }
  return output;
}
function toOption(option, productId) {
  if (!option || !option.title || !Array.isArray(option.values)) throw new HttpError(400, 'Invalid product option');
  return { product_id: productId, title: option.title, shape: option.shape || 'square', radius: parseInt(option.radius, 10) || 0, type: option.type || 'text', values: option.values.join(',') };
}
async function storeImage(image, productId) {
  if (image.content && /^https?:\/\//i.test(image.content)) return image.content;
  const match = String(image.content || '').match(/^data:(image\/(?:png|jpe?g|gif|webp));base64,(.+)$/i);
  const data = match ? match[2] : image.content;
  const extension = match ? match[1].split('/')[1].replace('jpeg', 'jpg') : ({ 'image/png': 'png', 'image/jpg': 'jpg', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' })[image.type];
  if (!data || !extension || !/^[A-Za-z0-9+/]+=*$/.test(data)) throw new HttpError(400, 'Invalid image data');
  const directory = path.join(mediaRoot, String(productId));
  await fs.mkdir(directory, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  await fs.writeFile(path.join(directory, filename), Buffer.from(data, 'base64'));
  return `/media/${productId}/${filename}`;
}
async function saveChildren(product, data, transaction, creating = false) {
  if (Array.isArray(data.category_ids)) {
    const ids = [...new Set(data.category_ids.map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) throw new HttpError(400, 'Invalid category_ids');
    const categories = await Category.findAll({ where: { id: ids }, transaction });
    if (categories.length !== ids.length) throw new HttpError(400, 'One or more categories do not exist');
    await product.setCategories(categories, { transaction });
  }
  if (Array.isArray(data.options)) {
    for (const option of data.options) {
      if (option.deleted && option.id) await ProductOption.destroy({ where: { id: option.id, product_id: product.id }, transaction });
      else if (option.id) {
        const existing = await ProductOption.findOne({ where: { id: option.id, product_id: product.id }, transaction });
        if (!existing) throw new HttpError(400, 'Option does not belong to product');
        const values = Array.isArray(option.values || option.value) ? (option.values || option.value).join(',') : existing.values;
        await existing.update({ title: option.title || existing.title, shape: option.shape || existing.shape, radius: option.radius === undefined ? existing.radius : parseInt(option.radius, 10) || 0, type: option.type || existing.type, values }, { transaction });
      } else {
        const normalized = option.values ? option : { ...option, values: option.value };
        await ProductOption.create(toOption(normalized, product.id), { transaction });
      }
    }
  }
  if (Array.isArray(data.images)) {
    for (const image of data.images) {
      if (image.deleted && image.id) await ProductImage.destroy({ where: { id: image.id, product_id: product.id }, transaction });
      else if (image.id) {
        const existing = await ProductImage.findOne({ where: { id: image.id, product_id: product.id }, transaction });
        if (!existing) throw new HttpError(400, 'Image does not belong to product');
        if (image.content && !/^https?:\/\//i.test(image.content)) await existing.update({ path: await storeImage(image, product.id) }, { transaction });
      } else await ProductImage.create({ product_id: product.id, enabled: true, path: await storeImage(image, product.id) }, { transaction });
    }
  }
  if (creating && !Array.isArray(data.category_ids)) await product.setCategories([], { transaction });
}
function baseValues(data) {
  if (!data.name || !data.slug || data.price === undefined || data.price_with_discount === undefined) throw new HttpError(400, 'Invalid product data');
  const price = Number(data.price); const discount = Number(data.price_with_discount);
  if (!Number.isFinite(price) || !Number.isFinite(discount)) throw new HttpError(400, 'Invalid product price');
  return {
    enabled: data.enabled ?? false, name: data.name, slug: data.slug,
    use_in_menu: data.use_in_menu ?? false, stock: data.stock ?? 0,
    description: data.description ?? null, price, price_with_discount: discount,
  };
}
async function search(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(limit) || (limit !== -1 && limit < 1) || !Number.isInteger(page) || page < 1) throw new HttpError(400, 'Invalid pagination');
  const where = {};
  if (query.match) where[Op.or] = [{ name: { [Op.like]: `%${query.match}%` } }, { description: { [Op.like]: `%${query.match}%` } }];
  if (query['price-range']) {
    const match = String(query['price-range']).match(/^([0-9]+(?:\.[0-9]+)?)-([0-9]+(?:\.[0-9]+)?)$/);
    if (!match || Number(match[1]) > Number(match[2])) throw new HttpError(400, 'Invalid price-range');
    where.price = { [Op.between]: [Number(match[1]), Number(match[2])] };
  }
  const include = productIncludes();
  if (query.category_ids !== undefined) {
    const ids = String(query.category_ids).split(',').map(Number);
    if (!ids.length || ids.some((id) => !Number.isInteger(id) || id < 1)) throw new HttpError(400, 'Invalid category_ids');
    include[0].where = { id: { [Op.in]: ids } }; include[0].required = true;
  }
  const optionFilters = { ...(query.option || {}) };
  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^option\[(\d+)\]$/);
    if (match) optionFilters[match[1]] = value;
  }
  for (const [optionId, rawValues] of Object.entries(optionFilters)) {
    if (!validId(optionId)) throw new HttpError(400, 'Invalid option filter');
    const values = String(rawValues).split(',').map((value) => value.trim()).filter(Boolean);
    if (!values.length) throw new HttpError(400, 'Invalid option filter');
    const valueChecks = values.map((value) => `FIND_IN_SET(${sequelize.escape(value)}, po.values) > 0`).join(' OR ');
    where[Op.and] = [...(where[Op.and] || []), sequelize.literal(`EXISTS (SELECT 1 FROM product_options AS po WHERE po.product_id = Product.id AND po.id = ${Number(optionId)} AND (${valueChecks}))`)];
  }
  const result = await Product.findAndCountAll({ where, include, distinct: true, limit: limit === -1 ? undefined : limit, offset: limit === -1 ? undefined : (page - 1) * limit, order: [['id', 'ASC']] });
  return { data: result.rows.map((product) => toResponse(product, query.fields)), total: result.count, limit, page };
}
async function get(id) {
  if (!validId(id)) throw new HttpError(400, 'Invalid product id');
  const product = await Product.findByPk(id, { include: productIncludes() });
  if (!product) throw new HttpError(404, 'Product not found');
  return toResponse(product);
}
async function create(data) {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.create(baseValues(data), { transaction });
    await saveChildren(product, data, transaction, true);
    await transaction.commit();
    return get(product.id);
  } catch (error) { await transaction.rollback(); throw error; }
}
async function update(id, data) {
  if (!validId(id)) throw new HttpError(400, 'Invalid product id');
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(id, { transaction });
    if (!product) throw new HttpError(404, 'Product not found');
    await product.update(baseValues(data), { transaction });
    await saveChildren(product, data, transaction);
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
}
async function remove(id) {
  if (!validId(id)) throw new HttpError(400, 'Invalid product id');
  const product = await Product.findByPk(id);
  if (!product) throw new HttpError(404, 'Product not found');
  await product.destroy();
}

module.exports = { search, get, create, update, remove };
