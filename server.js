import config from './config.js';
import express from 'express';
import logger from 'morgan';
import './src/controllers/user.js';
import './src/controllers/role.js';
import './src/controllers/location.js';
import './src/controllers/area.js';
import './src/controllers/file.js';
import './src/controllers/field.js';
import './src/controllers/userArea.js';
import './src/controllers/shift.js';
import './src/controllers/booking.js';
import './src/controllers/shiftSeries.js';
import './src/controllers/follower.js';
import './src/controllers/followerNote.js';
import { router } from './src/utils/handler.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use('/photos', express.static('photos'));

app.use('/', router);

const server = app.listen(config.port);

export default server;
