const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const setupRoutes = require('./server/routes');

const app = express();

app.use(bodyParser.json());

setupRoutes(app);

app.use(express.static('dist'));
app.listen(port, () => console.log('Server ready'));