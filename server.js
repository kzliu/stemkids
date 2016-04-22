var express = require('express');
var bodyParser = require('bodyParser');
var anyDB = require('any-db');
var engines = require('consolidate');


var app = express();
var conn = anyDB.createConnection('sqlite3://');
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use(bodyParser.urlencoded());
app.use(express.static('public'));