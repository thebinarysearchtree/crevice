const config = require('./config');
const express = require('express');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use('/photos', express.static('photos'));

const users = require('./src/routes/user');
const roles = require('./src/routes/role');
const locations = require('./src/routes/location');
const areas = require('./src/routes/area');
const files = require('./src/routes/file');
const fields = require('./src/routes/field');
const userAreas = require('./src/routes/userArea');
const shifts = require('./src/routes/shift');
const bookings = require('./src/routes/booking');

app.use('/users', users);
app.use('/roles', roles);
app.use('/locations', locations);
app.use('/areas', areas);
app.use('/files', files);
app.use('/fields', fields);
app.use('/userAreas', userAreas);
app.use('/shifts', shifts);
app.use('/bookings', bookings);

const server = app.listen(config.port);

module.exports = server;