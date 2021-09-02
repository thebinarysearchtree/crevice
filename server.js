import config from './config.js';
import express from 'express';
import logger from 'morgan';
import users from './src/routes/user.js';
import roles from './src/routes/role.js';
import locations from './src/routes/location.js';
import areas from './src/routes/area.js';
import files from './src/routes/file.js';
import fields from './src/routes/field.js';
import userAreas from './src/routes/userArea.js';
import shifts from './src/routes/shift.js';
import bookings from './src/routes/booking.js';
import shiftSeries from './src/routes/shiftSeries.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use('/photos', express.static('photos'));

app.use('/users', users);
app.use('/roles', roles);
app.use('/locations', locations);
app.use('/areas', areas);
app.use('/files', files);
app.use('/fields', fields);
app.use('/userAreas', userAreas);
app.use('/shifts', shifts);
app.use('/bookings', bookings);
app.use('/shiftSeries', shiftSeries);

const server = app.listen(config.port);

export default server;
