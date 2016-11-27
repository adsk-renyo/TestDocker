var express = require('express');
var http = require('http');
var fs = require('fs');
var url = require('url');
var compression = require('compression');

var app = express();
var port = 8080;
app.use(compression({
	threshold:5
}))
http.createServer(app).listen(port);

console.log('listen to port ' + port + '...');
app.get('/', function(req, res) {
	res.send('hello from server root');
});
/*
app.get('/login', function(req, res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	res.send('/login find query = ' + JSON.stringify(query) );
})

app.get('/login/*', function(req, res) {
	res.send('/login/* url = ' + JSON.stringify(req.url) );
})*/

app.get('/:portalId/:portalAction', function (req, res) {
	res.send('/:portalId/:portalAction url = ' + JSON.stringify(req.url) + '; portalAction = ' + req.param('portalAction') );
	console.log('portalId = ' + req.param('portalId'));
	console.log('portalAction+' + req.param('portalAction'));
});

app.get('/user/:userid/:userAction', function(req, res) {
	res.send('/user/:userid/:userAction url = ' + JSON.stringify(req.url) + '; userAction = ' + req.param('userAction') );
	console.log(req.param('userid'));
})


app.get('/user/:userid', function(req, res) {
	res.send('/user/:userid url = ' + JSON.stringify(req.url) );
	console.log(req.param('userid'));
})

app.get('/rest/:queryType', function(req, res) {
	res.json({type: req.param('queryType')} );
})

app.get('/download', function(req, res) {
	res.download('npm-debug.log');
})

app.get('/file', function(req, res) {
	res.sendFile('npm-debug.log');
})

app.param('userid', function(req, res, next, value) {
	console.log('request received with userid = ', value);
	next();
})

app.param('userAction', function(req, res, next, value) {
	console.log('request received with userAction = ', value);
	next();
})
