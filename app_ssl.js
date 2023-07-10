const express = require('express');
const port = (process.env.VCAP_APP_PORT || process.env.port || 3150);
const https = require("https");
const fs = require("fs");

import routes from './routes';
import scrapeController from './controllers/scrapeController';

const app = express();

global.__basedir = __dirname;

app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, responseType");
    next();

});

https
    .createServer(
	{
	  key: fs.readFileSync("key.pem"),
	  cert: fs.readFileSync("cert.pem")	
	},
        app
    )
    .listen(port, ()=>{
	    console.log("[APP]", `Listening on port ...${port}`)
     });

app.use('/api/v1', routes);

scrapeController.init();

export default app;
