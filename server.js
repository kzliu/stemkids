var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var anyDB = require('any-db');
var engines = require('consolidate');
var crypto = require("crypto");

var app = express();
var server = http.createServer(app);
var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

var io = require('socket.io').listen(server);

app.engine('html', engines.hogan);
app.set('views', __dirname + '/updated_html'); // tell Express where to find templates
// app.use('/updated_html', express.static('updated_html'));
app.use(express.static('updated_html'));
// app.use('/fonts', express.static('updated_html/fonts'));
 
//set up body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


function hash_function(value, salt) {
	// function creates a hash from the inputted value and salt
	string = salt.cancat(value);
	hash = crypto.createHash(string);
	return hash;
}


function compare_hash(hash1, hash2) {
	if (hash1 === hash2)
		return true;
	else
		return false;
}

app.get('/', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('index.html',{ root : __dirname});
});


io.sockets.on('connection', function(socket) {
	console.log('here');
	socket.on('existingUser', function(userID, callback) {
		console.log('made connection');
		checkUsername(userID, callback);
	});

	app.post('/createAccount', function(request, response) {
		var username = request.body.username;
		console.log('- Request received:', request.method, request.url);
		var message = "success";
		checkUsername(username, function(isUser) {
			if (isUser != 1) {
				var firstname = request.body.firstname;
				var lastname = request.body.lastname;
				var age = request.body.age;
				var grade = request.body.grade;
				var school = request.body.school;
				var email = request.body.email;
				var gender = request.body.gender;
				var phone = request.body.phone;
				var password = request.body.password;
				conn.query('INSERT INTO user_info VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [username, firstname, lastname, age, grade, school, gender, email, phone, password], function(err, res) {
					if (err) {
						message = "Could not properly insert value into database.";
						throw err;
						socket.emit('createAccountError', message);
					} else {
						response.render('profile.html');
					}
				});
			} else {
				message = "That username is already taken!";
				socket.emit('createAccountError', message);
			}
		});
	});
});

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

// set the app's server to listen on a given port
server.listen(1234, function(){
	console.log('- Server listening on given port 1234');
});

function checkUsername(userID, callback){
	var query = 'SELECT * FROM user_info WHERE login=$1;';
	conn.query(query,[userID], function(error, result) {
        if (error) throw error;
        var isUser = 0;
        if (result.rows.length != 0) {
        	isUser = 1;
        }
        console.log(isUser);
        callback(isUser);
        // return isUser;
    });
};

function generateCourseCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var result = '';
    for (var i = 0; i < 6; i++)
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};


function isCourse(id){
    conn.query('SELECT * FROM courses where course_id=$1', [id], function(error,result) {
        return (result.rows.length != 0);
    });
}
