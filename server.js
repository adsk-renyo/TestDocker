'use strict';

const express = require('express');
const mongoose = require('mongoose')
// Constants
const PORT = 8080;

// App
const app = express();
mongoose.connect("mongodb://mongo:27017");

app.get('/', function (req, res) {
  res.send('Hello world with mongo\n');
});

app.listen(PORT, function() {
	console.log('example app listening on port ' + PORT);
});
