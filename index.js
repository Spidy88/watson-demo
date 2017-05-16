const express = require('express');
const port = process.env.PORT || 3000;
const setupRoutes = require('./server/routes');

const app = express();

setupRoutes(app);
app.use(express.static('dist'));
app.listen(port, () => console.log('Server ready'));