/*----------------------------*
 *----  Required Modules  ----*
 *----------------------------*/

const express = require('express');             //  ... npm
const bodyParser = require('body-parser');      //  ... npm
const cors = require('cors');                   //  ... npm
const v = require('@vision-dbms/connect').v;    //  ... npm

const querystring = require('querystring');     //  ... node built-in

/*------------------------------------*
 *----  Lightweight Query Logger  ----*
 *------------------------------------*/

const logger = {
    enabled: false,
    log (something) {
        this.enabled && (
            console.log (something ()),
            console.log ('==============================================')
        )
    }
};
module.exports.logger = logger;

/******************/
function objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += '<br>' + p;
        }
    }
    return str;
}

function quote (str) {
    return '"' + str.replace ('/"/g', '\\"') + '"';
}

/******************/
function formatVisionRequestAsHtml (req, message, requestBuilder) {
    var result = '<!DOCTYPE html><html><body><h2>' + req.originalUrl + '</h2>';

    if (message)
        result += message + '<hr>';

    result += ' path:'   + req.path + '<hr>';
    result += ' params:' + JSON.stringify (req.params)  + '<hr>';
    result += ' query:'  + JSON.stringify (req.query)   + '<hr>';
    result += ' headers:'+ JSON.stringify (req.headers) + '<hr>';
    result += ' vision:' + requestBuilder (req) + '<hr>';

    result += objToString (req);

    result += '</body></html>';
    return result;
}

/******************/
function getRequestExpression (request) {
    return probeRequest(request,part=>part.expression);
}

function getRequestID (request) {
    return probeRequest (request,part=>part.queryID);
}

function probeRequest (request,f) {
    return (
        request.body && f(request.body)
    ) || (
        request.query && f(request.query)
    )
}

/******************/
class ClientObject {
    constructor (request, response, next) {
        this.request = request,
        this.response = response,
        this.next = next

        this.request.queryID = this.response.queryID = this.getQueryID ();
    }

    getAppName () {
        return this.getParam ("app");
    }
    getExpression () {
        return getRequestExpression(this.request);
    }
    getQueryID () {
        return getRequestID (this.request);
    }
    getQueryIDs () {
        return [this.getQueryID (), this.request.queryID, this.response.queryID];
    }
    getQueryString () {
        return querystring.stringify (this.request.query);
    }
    getParam (property) {
        return this.getProperty (this.request.params, property);
    }
    getQuery (property) {
        return this.getProperty (this.request.query, property);
    }
    getProperty (object, property) {
        return object.hasOwnProperty (property) ? object[property] : "";
    }
    isFinished () {
        return this.response.finished;
    }

    returnJSON (result) {
        logger.log (()=>({
            queryID: this.getQueryIDs (),
            action: "Return JSON",
            finished: this.isFinished(),
            vx: this.getExpression (),
            result
        }));
        return this.response
            .json (result)
            .end ();
    }
    returnResult (result) {
        logger.log (()=>({
            queryID: this.getQueryIDs (),
            action: "Return Result",
            finished: this.isFinished(),
            vx: this.getExpression (),
            result
        }));
        return this.response.send (result).end ();
    }
    returnError (result) {
        return this.response.send (result).end ();
    }
}

/******************/
function usingRequestExpression (req) {
    return getRequestExpression (req) || "";
}

/******************/
function RouteHandler (requestFormatter) {
    return function (req, res, next) {
        const vx = requestFormatter (req);
        const co = new ClientObject (req, res, next);

        logger.log (()=>({
            queryID: co.getQueryIDs (),
            action: "Start",
            vx
        }));

/*----------------------------------------------------------------
 *-----
 *-----  Here's where 'v' gets called...
 *-----
 *----------------------------------------------------------------
*/
        return v (vx, co).then (
            str => {
                logger.log (()=>({
                    queryID: co.getQueryIDs(),
                    action: "Cleanup",
                    finished: res.finished,
                    vx,
                    str
                }));
                if (!res.finished) {
                    co.returnResult (str);
                }
            },
            str => {
                if (!res.finished) {
                    co.returnError (
                        formatVisionRequestAsHtml (req, str, requestFormatter)
                    )
                }
            }
        );
    }
}

/*------------------------------------------*
 *----  The 'vision_server' sub-app...  ----*
 *------------------------------------------*/

function App () {
    const app = express ();
    app.use (bodyParser.json());
    app.use (bodyParser.urlencoded({extended: true}));
    app.use (cors());
    app.route ('/')
	.get  (RouteHandler (usingRequestExpression))
	.post (RouteHandler (usingRequestExpression))
	.all  (RouteHandler (usingRequestExpression));
    return app;
}

module.exports.app = App();
module.exports.v = v;
