const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (res.headersSent) return next(error);
  if (error instanceof UniqueConstraintError || error instanceof ValidationError || error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: error.message });
  }
  const status = Number(error.status) || 500;
  return res.status(status).json({ message: status === 500 ? 'Internal server error' : error.message });
}

module.exports = errorHandler;
