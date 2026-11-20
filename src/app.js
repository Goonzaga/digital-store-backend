require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/error-handler');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/media', express.static(path.resolve(process.cwd(), 'uploads')));
app.use('/v1/user', require('./routes/user-routes'));
app.use('/v1/category', require('./routes/category-routes'));
app.use('/v1/product', require('./routes/product-routes'));
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
app.use(errorHandler);

module.exports = app;
