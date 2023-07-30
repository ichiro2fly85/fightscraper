import express from 'express';

const routes = express();

import basicController from './controllers/baseController.js';
import scrapeController from './controllers/scrapeController.js';


routes.get('/', basicController.get);
routes.get('/eventdata', scrapeController.getEventSchedule);
routes.get('/eventrss', scrapeController.getRssJSON);

export default routes;
