const config = require('./config');
const express = require('express');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());

const users = require('./src/routes/user');

app.use('/users', users);

const server = app.listen(config.port);

module.exports = server;