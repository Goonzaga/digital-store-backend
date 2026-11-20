require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');

const port = Number(process.env.PORT || 3000);
sequelize.authenticate()
  .then(() => app.listen(port, () => console.log(`Digital Store API listening on port ${port}`)))
  .catch((error) => { console.error('Unable to connect to MySQL:', error.message); process.exitCode = 1; });
