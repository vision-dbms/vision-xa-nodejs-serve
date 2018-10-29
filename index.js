const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const morgan = require('morgan');
const path = require('path');

/*-------------------*/
/*----  express  ----*/
/*-------------------*/
const app = express ();
module.exports.app = app;

/*--------------------------*
 *----  best practices  ----*
 *--------------------------*/
app.use (helmet ());

/*-------------------*/
/*----  logging  ----*/
/*-------------------*/
app.use (
    morgan (
        'combined', {
            stream: fs.createWriteStream(
                path.join(__dirname, '/logs', 'access.log'), {flags: 'a'}
            )
        }
    )
);

/*--------------------------*/
/*----  static content  ----*/
/*--------------------------*/
app.use (express.static (path.join (__dirname, 'public')));

/*-------------------*/
/*----  servers  ----*/
/*-------------------*/
const httpServer = http.createServer (app);

/*-----------------------*/
/*----  http server  ----*/
/*-----------------------*/
const httpsServer = https.createServer ({
    key : fs.readFileSync('./config/certs/key.pem'),
    cert: fs.readFileSync('./config/certs/cert.pem')
}, app);

/*--------------------------*/
/*----  the good stuff  ----*/
/*--------------------------*/

/*----------------*/
const visionServer = require('./lib/vision_server');
module.exports.visionServer = visionServer;
app.use ('/vision/api', visionServer.app);

/*----------------*/
const ports = (port=>({
    http : +port,
    https: +port+443
}))(process.env.PORT || 3001);
module.exports.ports = ports;

const servers = {
    http : httpServer,
    https: httpsServer
};
module.exports.servers = servers;

['http','https'].map(
    k=>((k,s,p)=>s.listen(p,()=>{
        console.log(`'${k}' server listening on port ${p}`);
    }))(k,servers[k],ports[k])
);
