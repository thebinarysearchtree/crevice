const config = require('./config');
const express = require('express');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());

const users = require('./src/routes/user');
const roles = require('./src/routes/role');
const locations = require('./src/routes/location');
const areas = require('./src/routes/area');

app.use('/users', users);
app.use('/roles', roles);
app.use('/locations', locations);
app.use('/areas', areas);

const server = app.listen(config.port);

module.exports = server;