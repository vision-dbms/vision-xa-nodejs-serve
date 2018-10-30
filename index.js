/*----------------------------*
 *----  Required Modules  ----*
 *----------------------------*/

const express = require('express');       //  ... npm
const helmet  = require('helmet');        //  ... npm
const morgan  = require('morgan');        //  ... npm

const fs    = require('fs');              //  ... node built-in
const http  = require('http');            //  ... node built-in
const https = require('https');           //  ... node built-in
const path  = require('path');            //  ... node built-in

/*----------------------------------------*
 *----                                ----*
 *----  Configuration Access Utility  ----*
 *----                                ----*
 *----------------------------------------*/

class Configuration {
    constructor (configurationName) {
        this.environmentPrefix = (
            process.env[configurationName]
                ? process.env[configurationName]
                : `${configurationName}`
        ).concat ('_');
    }

    getVariable (item) {
        return this.environmentPrefix.concat (item);
    }
    getItem (item) {
        return process.env[this.getVariable (item)];
    }

    deleteItem (item) {
        delete process.env[this.getVariable (item)];
    }

    ifItem (...items) { // === ifItem (item, item ..., callback)
        // Remove the 'callback' from the end of the item list...
        const callback=items.pop ();
        /// ... and call that callback ...
        return this.onItem (
            ...items,
            (...items)=>(
                // ... iff all items are defined (and not 'false'):
                items.reduce ((cum,cur)=>cum && cur,true) && callback(...items)
            )
        );
    }
    onItem (...items) { // === onItem (item, item ..., callback)
        // Remove the 'callback' from the end of the item list...
        const callback=items.pop ();
        // ... and apply it to the item values:
        return callback (...items.map (item=>this.getItem (item)));
    }
}

/*--------------------------*
 *----                  ----*
 *----  The Main Event  ----*
 *----                  ----*
 *--------------------------*/

/*-------------------------*
 *----  configuration  ----*
 *-------------------------*/

const MyConfiguration = new Configuration ('vision_xa_nodejs_serve');

/*-------------------*/
/*----  express  ----*/
/*-------------------*/
const app = express ();
module.exports.app = app;

/*--------------------------------------*
 *----  basic boilerplate security  ----*
 *--------------------------------------*/
app.use (helmet ());

/*-------------------*/
/*----  logging  ----*/
/*-------------------*/
MyConfiguration.ifItem (
    'log_file', logfile=>app.use (
        morgan (
            'combined', {
                stream: fs.createWriteStream(logfile, {flags: 'a'})
            }
        )
    )
);

/*---------------------------------*/
/*----  '/vision/api' handler  ----*/
/*---------------------------------*/

const visionServer = require('./lib/vision_server');
module.exports.visionServer = visionServer;
app.use ('/vision/api', visionServer.app);

/*--------------------------*
 *----  web servers...  ----*
 *--------------------------*/

const servers = {
};

/*--------------------*
 *----  ... http  ----*
 *--------------------*/

MyConfiguration.ifItem (
    'http_port', port=>{
        const newServer=http.createServer (app);
        console.log (`Starting http server on port ${port}`);
        newServer.listen (port);
        servers.http = newServer;
    }
);

/*------------------------*
 *----  https server  ----*
 *------------------------*/

MyConfiguration.ifItem (
    'https_port', 'https_key_file', 'https_cert_file', (port,keyfile,certfile)=>{
        const httpsOptions = {
            key  : fs.readFileSync (keyfile),
            cert : fs.readFileSync (certfile)
        };
        MyConfiguration.ifItem (
            'https_passphrase', passphrase=>{
                httpsOptions.passphrase = passphrase;
                MyConfiguration.deleteItem ('https_passphrase');
            }
        );
        const newServer=https.createServer (httpsOptions, app);
        console.log (`Starting https server on port ${port}`);
        newServer.listen (port);
        servers.https=newServer;
    }
);
