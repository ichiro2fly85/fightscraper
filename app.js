const express = require('express');
const port = 3150;
const ssl_port = 4150;
const http = require('http');
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

http.createServer(app).listen(port, ()=>{
	console.log("[APP]", `Listening on port ...${port}`)
});

https.createServer(
	{
	  key: fs.readFileSync("privkey.pem"),
	  cert: fs.readFileSync("fullchain.pem")	
	},
        app
     )
     .listen(ssl_port, ()=>{
	    console.log("[APP]", `SSL Listening on port ...${ssl_port}`)
     });

app.use('/api/v1', routes);

scrapeController.init();

export default app;