// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var path = require('path');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator')
var os = require('os');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration
var env = process.env.NODE_ENV || 'development';

console.log('log is saved to ' + os.homedir()  + '/log');
console.log('The magic happens on port ' + port);
var logDirectory = path.join(os.homedir(), 'log')
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})
// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

var util = require('util');
var logFile = fs.createWriteStream(logDirectory + '/console.txt', { flags: 'a' });
var logStdout = process.stdout;

console.log = function () {
	var dt = new Date().toISOString();
	logFile.write("\n" + dt + "\n" + util.format.apply(null, arguments) + '\n');
	logStdout.write("\n" + dt + "\n" + util.format.apply(null, arguments) + '\n');
}
console.error = console.log;

if('development' == env) {
	// set up our express application
	app.use(cookieParser()); // read cookies (needed for auth)
	app.use(bodyParser.urlencoded({extended: true})); // get information from html forms
	app.use(bodyParser.json()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(session({ secret: 'renyongfu',
		resave: true,
		saveUninitialized: true})); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

}

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic starts on port ' + port);
