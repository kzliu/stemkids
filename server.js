var express = require('express');
var bodyParser = require('bodyParser');
var anyDB = require('any-db');
var engines = require('consolidate');
var crypto = require("crypto");

var app = express();
var conn = anyDB.createConnection('sqlite3://');
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.use(bodyParser.urlencoded());
app.use(express.static('public'));


function hash_function(value, salt) {
	// function creates a hash from the inputted value and salt
	string = salt.cancat(value);
	hash = crypto.createHash(string);
	return hash;
}


function compare_hash(hash1, hash2) {
	if hash1 === hash2:
		return true;
	else:
		return false;
}


app.get('/profile/:identifyer', function(request, response){
	var identifyer = request.params.identifyer;
	// select 
	var q = conn.query("SELECT * FROM user_info, classes, class_attendance WHERE user_info.id = $1", [identifyer], function(err, data){
		// send data to the front end as a response
		response.json(data.rows);
		// print response to console (should be unique)
		console.log(data.rows);
		// finish and close response
		response.end();
	});
	// print to console upon successful query completion
	q.on('end', function(){
		console.log('data successfuly sent')
	});
});


app.get('/');

// set the app's server to listen on a given port
app.listen(1234, function(){
	console.log('- Server listening on given port');
});