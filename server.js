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
        callback(isUser);
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
};


app.get('/', function(request, response){
    console.log('- Request received:', request.method, request.url);
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

app.get('/admin', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('adminhome.html',{ root : __dirname});
});

app.get('/createCourse',function(request, response) {
	console.log('- Request received:', request.method, request.url);
	var courseCode = generateCourseCode();
	while (isCourse(courseCode)) {
		courseCode = generateCourseCode();
	}
	console.log("course code " + courseCode);
    response.render('createcourse.html',{ root : __dirname, course_id: courseCode});
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
			   			loggedin.push(username);
						response.render('profile.html', {username:username, firstname:firstname});	
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
			}
		});
	    response.on('close', function(){
	        console.log("Close received for create account.");
	    });
	});


	app.post('/login', function(request, response){
		var username = request.body.username;
		var password = request.body.password;
		var message = "success";
		console.log('- Request received:', request.method, request.url);
		// password = String(hash(password, username));
		var q = conn.query("SELECT user_id, first_name, password FROM user_info WHERE login = $1;", [username], function(err, data){
			// handle errors
			if (err) {
				
				message = "Server encountered an error while attempting to retrieve";
				throw err;
				response.render('login.html', {message:message});
			}
			// if the data element returned is empty, indicate to the user that no password and username combination was found
			if (data.rows.length == 0){
				message = "No user/password combination found";
				console.log(message + password);
				// socket.emit('loginError', message);
				response.render('login.html', {message:message});
			} else {
				// iterate through the set of elements returned (to handle the case where more than one is returned)
				var rows = data.rows;
				var firstname = "";
				for (var i = 0; i < data.rows.length; i++) {
					var password2 = data.rows[i].password;
					password = hash(password, username);
					var match = compare_hash(password, password2);
					console.log(password);

					if (match) {
						firstname = rows[i].first_name;
					}
				}
				// handle the case where no logins are found
				if (firstname === "") {
					message = "No user/password combination found";
					console.log(message);
					response.render('login.html', {message:message});
				} else {
					loggedin.push(username);
					response.render('profile.html', {username:username, firstname:firstname});
				// socket.emit("loggedIn", username); // emit a signal to indicate a successful connection
				}
			}
		});
		q.on('end', function(){
			console.log('login function executed');
		});
	});
	
	// add lecture and render lecture and quiz page
	app.post('/addLecture', function(request, response){
		console.log('- Request received:', request.method, request.url);
		var code = request.body.courseId; 
		var title = request.body.courseTitle;
		var summary = request.body.courseSummary;
    	response.render('addLecture.html',{ root : __dirname, courseId: code, courseTitle: title, courseSummary: summary});
	});


	// add class to the database
	app.post('/addClass', function(request, response){
		var lectureTitle = request.body.lectureTitle;
		var video = request.body.video;
		var courseId = request.body.courseId;
		var courseTitle = request.body.courseTitle;
		var quiz_list = request.body.quizes;
		var length = quiz_list.length;
		for (var i = 0; i < length; i++) {
			var 
		}
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


// set the app's server to listen on a given port
server.listen(1234, function(){
	console.log('- Server listening on given port 1234');
});
