#  vision-xa-nodejs-serve

A lightweight, _[expressjs](https://www.npmjs.com/package/express)_ powered, environment variable configurable web server implementing a simple _Vision_ expression evaluation API built using _[@vision-dbms/connect](https://www.npmjs.com/package/@vision-dbms/connect)_.

###  Installation

After cloning or downloading a copy this repository or a fork of it, type:
```bash
cd THE_DIRECTORY_CONTAINING_YOUR_CLONE_OR_DOWNLOAD
npm install
```
to install and build its dependencies.

###  Configuration and Use

All configuration of this package is done using environment variables.  For example, assuming your current directory is the one containing the clone or copy you made above, the following _bash_ commands:

```bash
export vision_xa_nodejs_serve_http_port=2300
node index
```

will configure and start an _http_ server listening at port _2300_.  The following _tcsh_ commands:

```tcsh
setenv vision_xa_nodejs_serve_http_port 2300
node index
```

will do the same.  In either case, you should see the following output:

<pre>
Starting http server on port 2300
</pre>

Once started, you can confirm that your server is operating correctly by asking it to evaluate a _Vision_ expression.  For example, the following _curl_ command:

<pre>
> <b>curl http://localhost:2300/vision/api?expression=showInheritance</b>
***  Class Does Not Have Schema Data ***
---> CoreWorkspace
------> CoreWorkspace
---------> BuiltInWorkspace
------------> Object
</pre>

displays some simple inheritance information from _Vision_.

By overridable default, all environment variables used to configure this web-server begin with the prefix <i>vision_xa_nodejs_serve_</i> and are followed by the name of a configuration parameter.  For example, to append standard _Apache_ combined log records to a file of your choosing, set the following environment variable:

```bash
export vision_xa_nodejs_serve_log_file=PATH_TO_YOUR_LOG_FILE
```

before starting your server.

While _http_ works well for basic testing, you may also need to support _https_ requests.  To configure an _https_ server listening at port _2301_, for example, you need to set at least the following three environment variables:

```bash
export vision_xa_nodejs_serve_https_port=2301
export vision_xa_nodejs_serve_https_key_file=PATH_TO_YOUR_PEM_FORMAT_KEY_FILE
export vision_xa_nodejs_serve_https_key_file=PATH_TO_YOUR_PEM_FORMAT_CERT_CHAIN_FILE
```

and, if your private key is encrypted with a pass-phrase:

```bash
export vision_xa_nodejs_serve_https_https_passphrase=YOUR_SECRET_PASS_PHRASE
```

(Don't worry too much, the value for that environment variable will be deleted from the node process as soon as it has been used to decrypt your private key).

See the documentation for _[node.js](https://nodejs.org)_ in general and _[node.js https.createServer](https://nodejs.org/dist/latest-v8.x/docs/api/https.html#https_https_createserver_options_requestlistener)_ in particular for more information.

### A _Python_ example

ON THE WAY
