const express = require('express');
const port = (process.env.VCAP_APP_PORT || process.env.port || 3000);

import routes from './routes';
import scrapeController from './controllers/scrapeController';

const app = express();

global.__basedir = __dirname;

app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, responseType");
    next();

});

app.use('/api/v1', routes);

app.listen(port, () => console.log("[APP]", `Listening on port ...${port}`));

scrapeController.init();

export default app;