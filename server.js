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


app.get('/profile/:identifyer', function(request, response){
	var identifyer = request.params.identifyer;
	var q = conn.query("SELECT * FROM user_info, course, course_attendance WHERE user_info.id = $1", [identifyer], function(err, data){
		// send data to the front end as a response
		response.json(data.rows);
		console.log(data.rows);
		// finish and close response
		response.end();
	});
	q.on('end', function(){
		console.log('data successfuly sent')
	});
});