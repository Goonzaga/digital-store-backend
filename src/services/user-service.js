const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HttpError } = require('./errors');

async function create(data) {
  const { firstname, surname, email, password, confirmPassword } = data;
  if (!firstname || !surname || !email || !password || password !== confirmPassword) throw new HttpError(400, 'Invalid user data');
  const user = await User.create({ firstname, surname, email, password: await bcrypt.hash(password, 10) });
  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    email: user.email,
  };
}

async function getById(id) {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

async function update(id, data) {
  const user = await User.unscoped().findByPk(id);
  if (!user) throw new HttpError(404, 'User not found');
  const { firstname, surname, email } = data;
  if (!firstname || !surname || !email) throw new HttpError(400, 'Invalid user data');
  await user.update({ firstname, surname, email });
}

async function remove(id) {
  const user = await User.unscoped().findByPk(id);
  if (!user) throw new HttpError(404, 'User not found');
  await user.destroy();
}

async function token(email, password) {
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const user = await User.unscoped().findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new HttpError(400, 'Invalid email or password');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

module.exports = { create, getById, update, remove, token };
