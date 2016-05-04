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


function hash(value, salt) {
	// function creates a hash from the inputted value and salt
	var secret = 'stemkids'; // private key for encryption purposes
	var string = salt + value;
	var hash = crypto.createHash('sha256', secret).update(string).digest('hex');
	return hash;
}


function compare_hash(hash1, hash2) {
	if (hash1 === hash2)
		return true;
	else
		return false;
}


function checkUsername(userID, callback){
	var query = 'SELECT * FROM user_info WHERE login=$1;';
	conn.query(query,[userID], function(error, result) {
        if (error) throw error;
        var isUser = 0;
        if (result.rows.length != 0) {
        	isUser = 1;
        }
        // console.log(isUser);
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


app.get('/', function(request, response){
    console.log('- Request received:', request.method, request.url);
    // conn.query('SELECT logged_in FROM user_info WHERE login = $1', [username], function(err, data){
    // 	if () {

    // 	}
    // });
    response.render('index.html',{ root : __dirname});
});

app.get('/login', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('login.html',{ root : __dirname});
});

app.get('/createAccount', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('account.html',{ root : __dirname});
});

var loggedin = [];

io.sockets.on('connection', function(socket) {
	socket.on('existingUser', function(userID, callback) {
		checkUsername(userID, callback);
	});

	app.post('/createAccount', function(request, response) {
		var username = request.body.username;
		console.log('- Request received:', request.method, request.url);
		var message = "success";
		checkUsername(username, function(isUser) {
			var firstname = request.body.firstname;
			var lastname = request.body.lastname;
			var age = request.body.age;
			var grade = request.body.grade;
			var school = request.body.school;
			var email = request.body.email;
			var gender = request.body.gender;
			var phone = request.body.phone;
			var password = request.body.password;
			if (isUser != 1) {
				password = hash(password, username);
				console.log("passowrd " + password);
				conn.query('INSERT INTO user_info VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [username, firstname, lastname, age, grade, school, gender, email, phone, password], function(err, res) {
					if (err) {
						message = "Could not properly insert value into database.";
						throw err;
						// socket.emit('createAccountError', message);
						response.render('account.html', {message:message, firstname:firstname, lastname:lastname, age:age, grade:grade, email:email, phone:phone, school:school});
					} else {
						// var q = conn.query("SELECT last_insert_rowid() FROM user_info;", function(error, result){
						// 		if (error) throw error;
				  //               var rows = result.rows;
				  //               for (var i in rows){
				  //               	console.log(rows[i].user_id);
				  //               	
			   //              	}
			   			loggedin.push(username);
						response.render('profile.html', {username:username, firstname:firstname});
						// });
						
					}
				});
			} else {
				message = "That username is already taken!";
				console.log(message);
				// response.redirect({message:message}, 'account.html');
				// socket.emit('createAccountError', message);
				// repsonse.end();
				// response.redirect(request.get('referer'));
				
				//make it so all the preexisting information stays
				response.render('account.html', {message:message, firstname:firstname, lastname:lastname, age:age, grade:grade, email:email, phone:phone, school:school});
				// response.end();
			}
		});
	    response.on('close', function(){
	        console.log("Close received for create account!");
	    });
	});


	app.post('/login', function(request, response){
		var username = request.body.username;
		var password = request.body.password;
		var message = "success";
		console.log('- Request received:', request.method, request.url);
		// password = String(hash(password, username));
		var q = conn.query("SELECT user_id, first_name, password FROM user_info WHERE login = $1 AND password = $2;", [username, password], function(err, data){
			// handle errors
			if (err) {
				message = "Server encountered an error while attempting to retrieve";
				throw err;
				response.render('login.html', {message:message});
			}
			// if the data element returned is empty, indicate to the user that no password and username combination was found
			if (data.rows.length === 0){
				message = "No user/password combination found";
				console.log(message);
				// socket.emit('loginError', message);
				response.render('login.html', {message:message});
			} else {
				// iterate through the set of elements returned (to handle the case where more than one is returned)
				var rows = data.rows;
				var firstname = "";
				// for (var i in rows){
				// 	// console.log(rows[i].user_id);
				// 	// loggedin.push(rows[i].user_id);
				// 	firstname = rows[i].first_name;
				// }
				// iterate through the set of elements returned (to handle the case where more than one is returned)
				for (var i = 0; i < data.rows.length; i++) {
					password2 = data.rows[i].password;
					console.log(password2);
					match = compare_hash(password, password2);
					if (match) {
						firstname = rows[i].first_name;
					}
				}
				// handle the case where no logins are found
				if (firstname === "") {
					message = "No user/password combination found";
					console.log(message);
					response.render('login.html', {message:message});
				}
				loggedin.push(username);
				response.render('profile.html', {username:username, firstname:firstname});
				// socket.emit("loggedIn", username); // emit a signal to indicate a successful connection
			}
		});
		q.on('end', function(){
			console.log('login function executed');
		});
	});
});


// retrieve profile information
app.get('/profile/:identifyer', function(request, response){
	var identifyer = request.params.identifyer;
	// select 
	var q = conn.query("SELECT * FROM user_info, classes, class_attendance WHERE user_info.user_id = $1", [identifyer], function(err, data){
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


// app.get('/login', function(request, response){
// 	var username = request.body.username;
// 	var password = request.body.password;
// 	password = String(hash(password, username));
// 	var q = conn.query("SELECT password FROM user_info WHERE user_id = $1", [username], function(err, data){
// 		if (err) {
// 			message = "Server encountered an error while attempting to retrieve"
// 			throw err;
// 			socket.emit("loginError", message);
// 		}
// 		if (data.rows.length === 0){
// 			message = "No user found"
// 			socket.emit("noUserFoundError", message);
// 		} else {
// 			// iterate through the set of elements returned (to handle the case where more than one is returned)
// 			for (var i = 0; i < data.rows.length; i++) {
// 				password2 = data.rows[i];
// 				match = compare_hash(password, password2);
// 				if (match) {
// 					conn.query("UPDATE user_info SET logged_in = $1 WHERE username = $2", [1, username]); // indicate that the user in question has successfully logged in
// 					socket.emit("loggedIn", username); // emit a signal to indicate a successful connection
// 				} else {
// 					socket.emit("loginFailed", username); // emit a signal to indicate that login was unsuccessful
// 				}
// 			}
// 		}
// 	});
// 	q.on('end', function(){
// 		console.log('login function executed');
// 	});
// });


// set the app's server to listen on a given port
server.listen(1234, function(){
	console.log('- Server listening on given port 1234');
});
