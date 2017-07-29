/**
 * @summary index.js handles our routes and rendering the application.  
 * @description This file takes care of our server routing and handling.  
 * @version 1.0 
 * External Dependencies: express, baseServer, path, logger, cookie-parser, datatools
 * Internal Dependencies: none
 */

/**
 * Express is a node.js web application framework
 * @external "express"
 * @see {@link http://expressjs.com/} for more information
 */
var express = require("express");

/**
 * Node.js middleware that provides parsers for processing incoming HTTP requests.
 * @external "body-parser"
 * @see {@link https://github.com/expressjs/body-parser} for more information
 */
var bodyParser = require("body-parser");

/**
 * The path module contains several helper functions to help make path manipulation easier.
 * @external "path"
 */
var path = require('path');

// Instantiate our webserver
var app = express();

// allow our app to parse application/json easily and ensure we can handle large requests
app.use(bodyParser.json({limit: '50mb'})); 

// allow our app to parse application/x-www-form-urlencoded easily and ensure we can handle large requests
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 


app.use(express.static(path.join(__dirname, '/')));

const routes = require('./handlers/');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Ooops. Looks like weve misplaced something here.');
  err.status = 404;
  next(err);
});

// error handler
/* app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.message = err.message;
  res.error = err;

  // send the response
  res.status(err.status || 500);
  res.json({'error': res.locals.error.message});
});
 */
//set port to 3000 or use what's specified in environment execution
app.set('port', process.env.PORT || 3009);

//make sure we only add the listener when index.js is executed directly, not from our tests
if(!module.parent){
  //add a listener on our port and start the server
  app.listen(app.get('port'), function(){
    var port = app.get('port');
    //http://169.254.169.254/latest/meta-data/public-ipv4
    //console.log('Server is running on http://localhost:' + port + ' or http://127.0.0.1:' + port);
  });
}
module.exports = app;