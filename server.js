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
	var secret = 'stemkids'; // private key for encryption purposes (note: for RSA, this will need to be made a significantly larger random integer)
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

app.get('/:courseCode', function(request, response) {
	console.log('- Request received:', request.method, request.url);
	var courseCode = request.params.courseCode;
	console.log("course code " + courseCode);
	// console.log(request);
	conn.query('SELECT * FROM courses WHERE course_id = $1;', [courseCode], function(err, data){
		if (err) throw err;
		var num_classes = data.rows[0].num_classes;
		var course_des =  data.rows[0].course_description;
		var course_title =  data.rows[0].course_title;
		// console.log(course_des, course_title, num_classes);

		response.render('lecturelist.html',{ course_id: courseCode, courseTitle: course_title, courseSummary: course_des, numClasses:num_classes, root : __dirname});
	}); 
});

app.get('/l/:lectureId', function(request, response){
	conn.query('SELECT * FROM classes WHERE cless_id')
	response.render('course.html', {});
});

var loggedin = [];

io.sockets.on('connection', function(socket) {
	socket.on('existingUser', function(userID, callback) {
		checkUsername(userID, callback);
	});

	socket.on('lectures', function(courseCode, numClasses, username, callback) {
		conn.query('SELECT class_id, class_title, class_order FROM course_classes NATURAL JOIN classes WHERE course_id = $1;', [courseCode], function(err, data){
			if (err) throw err;
			var lectures = {};
			for (var i in data.rows){
				// console.log(data.rows[i]);
				var row = data.rows[i];
				lectures[row.class_order] = {class_id: row.class_id, class_title: row.class_title}
			}
			// console.log(obj);
			callback(lectures);
		});
	});

	socket.on('quiz', function(classId, callback) {

	});


	socket.on('fillCurrent', function(user, callback){
		console.log("fillCurrent is being called");
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT * FROM courses;', function(err, data){
				console.log("response from server: " + data.rows[0].course_description)
;				callback(data.rows);
			});
			// conn.query('SELECT * FROM enrollment AS e, courses AS c WHERE e.user_id=$1 AND e.course_id = c.course_id AND c.active=$2;', [userId, 1], function(err, data){
			// 	callback(data.rows);
			// });
		});
	});


	socket.on('fillHistory', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1', [user], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT * FROM courses NATURAL JOIN course_history WHERE user_id=$1 AND active=$2;', [userId, 0], function(err, data){
				callback(data.rows);
			});
		});
	});


	socket.on('fillFuture', function(user, callback){
		console.log('fillFuture being called')
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;
			console.log('user id in fillFuture function: ' + userId);
			conn.query('SELECT * FROM courses WHERE NOT EXISTS (SELECT * FROM enrollment NATURAL JOIN course_history WHERE user_id=$1 AND active=$2);', [userId, 0], function(err, data){
				callback(data.rows);
			});
		});
	});


	socket.on('fillAvailable', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT * FROM courses WHERE NOT EXISTS (SELECT * FROM enrollment NATURAL JOIN course_history WHERE user_id=$1 AND active=$2);', [userId, 1], function(err, data){
				callback(data.rows);
			});
		});
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
				console.log("password " + password);
				conn.query('INSERT INTO user_info (user_id, login, first_name, last_name, age, grade, school, gender, email, phone_num, password) VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [username, firstname, lastname, age, grade, school, gender, email, phone, password], function(err, res) {
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


	
	

	// add lecture and render lecture and quiz page
	app.post('/addLecture', function(request, response){
		console.log('- Request received:', request.method, request.url);
		var code = request.body.courseId; 
		var title = request.body.courseTitle;
		var summary = request.body.courseSummary;

		// // note: need to check to see if the course in question doesn't already exist (might want to add funtionality for course title)
		conn.query('SELECT * FROM courses WHERE course_id = $1;', [code], function(err, data){
			if (data.rows.length == 0) {
				conn.query('INSERT INTO courses (course_id, num_classes, course_title, course_description, active) VALUES ($1, $2, $3, $4, $5);', [code, 0, title, summary, 0]);
			} else { // handle the case where the course already exists
				console.log('course exists already');
			}
		});
    	response.render('addLecture.html',{ root : __dirname, courseId: code, courseTitle: title, courseSummary: summary, lectureNum: 1});
	});


	// handle post request to deal with logout
	app.post('/logout', function(request, response){
		console.log('- Request received:', request.method, request.url);

		username = request.body.username;
		var index = loggedin.indexOf(username);
		console.log(loggedin);
		if (index > -1) {
			loggedin.splice(index, 1);
		}
		console.log(loggedin);
		response.render('index.html',{ root : __dirname});
	});

});

app.post('/login', function(request, response){
	var username = request.body.username;
	var password = request.body.password;
	var message = "success";
	console.log('- Request received:', request.method, request.url);
	if (loggedin.indexOf(username) > -1) {
		response.render('profile.html', {username:username, firstname:firstname});
		response.end();
	}
	// password = String(hash(password, username));
	var q = conn.query("SELECT user_id, first_name, password FROM user_info WHERE login = $1;", [username], function(err, data){
		// handle errors
		if (err) {
			// generate message
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

// add class to the database
app.post('/addClass', function(request, response){
	console.log('- Request received:', request.method, request.url);
	// retrieve all static elements concerining the class and corresponding material
	var lectureTitle = request.body.lectureTitle;
	var video = request.body.video;
	var courseId = request.body.courseId;
	var summary = request.body.courseSummary;
	var courseTitle = request.body.courseTitle;
	var lecture_num = parseInt(request.body.lectureNum);
	var lecture_id = '/l/' + courseId + lecture_num;
	console.log(lecture_id);

	console.log(lectureTitle);
	console.log(video);
	console.log(courseId);
	console.log(courseTitle);
	
	for (var i = 1; i <=10; i++) {
		var question = request.body["question" + i];

		if (question){

			var question_id = '/q/' + courseId + i;
			console.log(question_id);
			// insert values into questions table
			conn.query('INSERT INTO questions (question_id, class_id, question) VALUES ($1, $2, $3);', [question_id, lecture_id, question]).on('error', console.error);

			// // retrieve the quiz answers
			var answers = [];
			for (var a = 1; a <= 4; a++){
				answers.push(request.body['answer'+ a + i]);
			}
			// // determine the correctness of each answer
			var correct = [];
			for (var c = 1; c <= 4; c++){
				var corr = request.body['answer' + c + 'corr' + i];
				if (corr){
					correct.push(1);
				} else {
					correct.push(0);
				}
			}
			console.log(answers);
			console.log(correct);

			// insert values into answers table
			for (var j = 0; j < 4; j++) {
				conn.query('INSERT INTO answers (question_id, class_id, correct, answer) VALUES ($1, $2, $3, $4);', [question_id, lecture_id, correct[j], answers[j]]).on('error', console.error);
			}
		}
	}
	
	//add this class to the course_class table
	conn.query('INSERT INTO course_classes (class_id, course_id, class_order) VALUES ($1, $2, $3);', [lecture_id, courseId, lecture_num]).on('error', console.error);

	conn.query('INSERT INTO classes (class_id, class_title, video) VALUES ($1, $2, $3);', [lecture_id, lectureTitle, video]).on('error', console.error);

	// get current number of classes
	conn.query('SELECT num_classes FROM courses WHERE course_id = $1', [courseId], function(err, data) {
		if (err) throw err;
		var num_classes = data.rows[0].num_classes;
		if (data.rows.length == 0){
			//how should we handle this error?
			console.log("THERE HAS BEEN AN ERROR UPLOADING CLASS");
		}
		num_classes++;
		console.log("the current number of classes in " + courseId + " is: " + num_classes);
		// update the courses table to include an additional class
		conn.query('UPDATE courses SET num_classes = $1 WHERE course_id = $2;', [num_classes, courseId]);
	});
	if (request.body.finishmeep == "finish"){

		conn.query('UPDATE courses SET active = 1 WHERE course_id = $1;', [courseId]).on('error', console.error);

		response.render('adminhome.html',{ root : __dirname, message:"Successfully uploaded and activated class."});
	} else {
		response.render('addLecture.html',{ root : __dirname, courseId: courseId, courseTitle: courseTitle, courseSummary: summary, lectureNum: lecture_num+1});
	}
});

// retrieve profile information
app.get('/profile/:identifyer', function(request, response){
	var identifyer = request.params.identifyer;
	// select elements for profile
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
