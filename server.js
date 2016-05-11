var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var anyDB = require('any-db');
var engines = require('consolidate');
var crypto = require("crypto");
var basicAuth = require('basicauth-middleware');

var app = express();
var server = http.createServer(app);
var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

var io = require('socket.io').listen(server);
var port = process.env.PORT || 1234;

app.engine('html', engines.hogan);
app.set('views', __dirname + '/updated_html'); // tell Express where to find templates
// app.use('/updated_html', express.static('updated_html'));
app.use(express.static('updated_html'));
// app.use('/fonts', express.static('updated_html/fonts'));
 
//set up body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// function to create a hash for the value and salt inserted
function hash(value, salt) {
	// function creates a hash from the inputted value and salt
	var secret = 'stemkids'; // private key for encryption purposes (note: for RSA, this will need to be made a significantly larger random integer)
	var string = salt + value;
	var hash = crypto.createHash('sha256', secret).update(string).digest('hex');
	return hash;
}


// function to compare two hashes
function compare_hash(hash1, hash2) {
	if (hash1 === hash2)
		return true;
	else
		return false;
}


// function to check user name validity
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


// function to generate course code
function generateCourseCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var result = '';
    for (var i = 0; i < 6; i++)
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};


// function to determine if the course in question is a course currently in the database
function isCourse(id){
    conn.query('SELECT * FROM courses where course_id=$1', [id], function(error,result) {
        return (result.rows.length != 0);
    });
};


// function to generate a user id
function getUserId(username) {
	conn.query('SELECT user_id FROM user_info WHERE login=$1', [username], function(error, result){
		return (result.rows[0].user_id);
	});
}


var loggedin = []; // initialize logged in list
var authorised = false;

// get request handler to render the initial html page
app.get('/', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('index.html',{ root : __dirname});
});


// get request handler to render the login page
app.get('/login', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('login.html',{ root : __dirname});
});


// get request handler to render the page for users to create an account
app.get('/createAccount', function(request, response){
    console.log('- Request received:', request.method, request.url);
    response.render('account.html',{ root : __dirname});
});


// get request handler to render admin page and to ensure basic authentication
app.get('/admin', basicAuth('yvonne', 'Stemkids1234'), function(request, response){
	authorised = true;
	console.log('- Request received:', request.method, request.url);
	response.render('adminhome.html',{ root : __dirname});
});


// get request to render page necessary to create course
app.get('/createCourse', function(request, response) {
	if (!authorised) {
		console.log('Not Authorised');
	} else {
		console.log('- Request received:', request.method, request.url);
		var courseCode = generateCourseCode();
		while (isCourse(courseCode)) {
			courseCode = generateCourseCode();
		}
	    response.render('createcourse.html',{ root : __dirname, course_id: courseCode});
	}
});


// need to implement further login functionality
app.get('/:username/c/:courseCode', function(request, response) {
	console.log('- Request received:', request.method, request.url);
	var courseCode = request.params.courseCode;
	var username = request.params.username;
	var index = loggedin.indexOf(username);
	if (index > -1) {
		conn.query('SELECT * FROM courses WHERE course_id = $1;', [courseCode], function(err, data){
			if (err) throw err;
			if (data.rows.length > 0){
				var num_classes = data.rows[0].num_classes;
				var course_des =  data.rows[0].course_description;
				var course_title =  data.rows[0].course_title;

				response.render('lecturelist.html',{ course_id: courseCode, courseTitle: course_title, courseSummary: course_des, numClasses:num_classes, username: username, root : __dirname});
			} else {
				console.log("THIS IS A PROBLEM AND SHOULD NOT GET HERE.");
			}
		}); 
	} else {
		response.render('index.html',{ root : __dirname});
	}
});


// need to implement further login function
app.get('/:username/l/:lectureId', function(request, response){
	var classId = '/l/' + request.params.lectureId;
	var username = request.params.username;
	var index = loggedin.indexOf(username);
	if (index > -1) {
		conn.query('SELECT * FROM classes WHERE class_id=$1;', [classId], function(err, data){
			var classTitle = data.rows[0].class_title;
			var classDesc = data.rows[0].class_description;
			response.render('updated_course.html', {classTitle: classTitle, description: classDesc, classId: classId, video: data.rows[0].video, username: username, root : __dirname});
		});
	} else {
		response.render('index.html',{ root : __dirname});
	}
});


io.sockets.on('connection', function(socket) {
	socket.on('existingUser', function(userID, callback) {
		checkUsername(userID, callback);
	});

	socket.on('lectures', function(courseId, numClasses, username, callback) {
		conn.query('SELECT user_id FROM user_info WHERE login=$1', [username], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT progress FROM enrollment WHERE user_id=$1 AND course_id=$2;', [userId, courseId], function(err, result){
				if (err) throw err;
				if (result.rows.length == 0){
					console.log("THIS SHOULDN'T HAPPEN");
				} else {
					var progress = result.rows[0].progress;
					conn.query('SELECT class_id, class_title, class_order FROM course_classes NATURAL JOIN classes WHERE course_id = $1;', [courseId], function(err, classData){
						if (err) throw err;
						var lectures = {};
						for (var i in classData.rows){
							var row = classData.rows[i];
							var lectureNumber = parseInt(row.class_order);
							var available = 0;
							if (lectureNumber < progress) {
								available = 1;
							} if (lectureNumber == progress){
								available = 1;
							}
							lectures[lectureNumber] = {class_id: row.class_id, class_title: row.class_title, available: available};
						}
						callback(lectures);
					});
				}
			});
		});
	});

	socket.on('quiz', function(classId, callback) {
		conn.query('SELECT * FROM questions NATURAL JOIN answers WHERE class_id = $1;', [classId], function(err, data){
			if (err) throw err;
			var questions = {};
			for (var i in data.rows){

				var row = data.rows[i];
				if (!questions[row.question_id]){
					questions[row.question_id] = {};
					questions[row.question_id]["question"] = row.question;
				}
				if (!questions[row.question_id]["answers"]) {
					questions[row.question_id]["answers"] = {};
				} 
				if (!questions[row.question_id]["answers"][row.answer_id]) {
					questions[row.question_id]["answers"][row.answer_id] = {};
				}
				questions[row.question_id]["answers"][row.answer_id]["answer"] = row.answer;
				questions[row.question_id]["answers"][row.answer_id]["correct"] = row.correct;
				
			}
			callback(questions);
		});
	});

	socket.on('/quizResponse', function(questionId, username, answerId) {
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [username], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('INSERT INTO quiz_history VALUES ($1,$2,$3);', [userId, answerId, questionId]).on('error', console.error);
		});
	});

	socket.on('/updateProgress', function(username, classId){
		conn.query('SELECT user_id FROM user_info WHERE login=$1', [username], function(err, data){
			var userId = data.rows[0].user_id;

			conn.query('INSERT INTO course_history VALUES ($1,$2);', [userId, classId]).on('error', console.error);
			conn.query('SELECT course_id, num_classes FROM course_classes AS cc NATURAL JOIN courses AS c WHERE cc.class_id=$1 AND c.course_id = cc.course_id;', [classId], function(err, result) {
				if (err) throw err;
				if (data.rows.length == 0){
					console.log("THIS SHOULDNT HAPPEN");
				} else {
					var courseId = result.rows[0].course_id;
					var numClasses = result.rows[0].num_classes;
					
					conn.query('SELECT progress FROM enrollment WHERE user_id=$1 AND course_id=$2;', [userId, courseId], function(err, result){
						if (err) throw err;
						if (result.rows.length == 0){
							console.log("meep");
						} else {
							var progress = result.rows[0].progress;
							if (progress >= numClasses){
								conn.query('UPDATE enrollment SET completed=1 WHERE user_id=$1 AND course_id=$2;', [userId, courseId]).on('error', console.error);
							} else {
								conn.query('UPDATE enrollment SET progress=progress+1 WHERE user_id=$1 AND course_id=$2;', [userId, courseId]).on('error', console.error);
							}
						}
					});
				}
				
			});
			
		});
	});


	socket.on('fillCurrent', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT * FROM courses AS c, enrollment AS e WHERE e.user_id=$1 AND c.active=$2 AND e.completed=$3 AND c.course_id = e.course_id;',[userId, 1, 0], function(err, data){
				if (err) throw err;
				callback(data.rows);
			});
		});
	});


	socket.on('fillHistory', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1', [user], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('SELECT * FROM courses AS c, enrollment AS e WHERE e.course_id=c.course_id AND e.user_id=$1 AND e.completed=$2;', [userId, 1], function(err, data){
				callback(data.rows);
			});
		});
	});


	socket.on('fillFuture', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;

			conn.query('SELECT * FROM courses WHERE active=$1;', [0], function(err, data){
				callback(data.rows);
			});
		});
	});


	socket.on('fillAvailable', function(user, callback){
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [user], function(err, data){
			var userId = data.rows[0].user_id;

			conn.query('SELECT * FROM courses AS c WHERE NOT EXISTS (SELECT * FROM enrollment AS e WHERE e.user_id=$1 AND c.course_id = e.course_id) AND c.active=$2;', [userId, 1], function(err, data){
				if (err) throw err;
				callback(data.rows);
			});
		});
	});


	// post request handler to create a new account
	app.post('/createNewAccount', function(request, response) {
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
				conn.query('INSERT INTO user_info (user_id, login, first_name, last_name, age, grade, school, gender, email, phone_num, password) VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [username, firstname, lastname, age, grade, school, gender, email, phone, password], function(err, res) {
					if (err) {
						message = "Could not properly insert value into database.";
						throw err;
						response.render('account.html', {message:message, firstname:firstname, lastname:lastname, age:age, grade:grade, email:email, phone:phone, school:school, root : __dirname});
					} else {
						response.render('login.html', {root : __dirname});	
					}
				});
			} else {
				message = "That username is already taken!";
				
				//make it so all the preexisting information stays
				response.render('account.html', {message:message, firstname:firstname, lastname:lastname, age:age, grade:grade, email:email, phone:phone, school:school, root : __dirname});
			}
		});
	    response.on('close', function(){
	        console.log("Close received for create account.");
	    });
	});

	// signal handler to handle users who wish to enroll in a course
	socket.on('enroll', function(username, course_id) {
		conn.query('SELECT user_id FROM user_info WHERE login=$1;', [username], function(err, data){
			var userId = data.rows[0].user_id;
			conn.query('INSERT INTO enrollment VALUES ($1, $2, $3, $4);', [userId, course_id, 0, 1]).on('error', console.error);
		});
	})

});

// handle post request to deal with logout
app.post('/logout', function(request, response){
	console.log('- Request received:', request.method, request.url);

	username = request.body.username;
	var index = loggedin.indexOf(username);

	if (index > -1) {
		loggedin.splice(index, 1);
	}
	response.render('index.html',{ root : __dirname});
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
		response.render('addLecture.html',{ root : __dirname, courseId: code, courseTitle: title, courseSummary: summary, lectureNum: 1});
	});
});


// post request to handle login capabilities
app.post('/loggedin', function(request, response){
	var username = request.body.username;
	var password = request.body.password;
	var message = "success";
	console.log('- Request received:', request.method, request.url);
	if (loggedin.indexOf(username) > -1){
		var q = conn.query("SELECT first_name FROM user_info WHERE login = $1;", [username], function(err, data){
			if (data.rows.length == 0){
				response.render('index.html',{ message:"Error going home. Please log back in.", root : __dirname});
			} else {
				response.render('profile.html', {username:username, firstname:data.rows[0].first_name});
			}
		});
	} else {
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
					if (match) {
						firstname = rows[i].first_name;
					}
				}
				// handle the case where no logins are found
				if (firstname === "") {
					message = "No user/password combination found";
					response.render('login.html', {message:message});
				} else {
					var index = loggedin.indexOf(username);
					if (index == -1) {
						loggedin.push(username);
					}
					response.render('profile.html', {username:username, firstname:firstname});
				}
			}
		});
		q.on('end', function(){
			console.log('login function executed');
		});
	}
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
	var lecture_desc = request.body.lectureSummary;
	var lecture_num = parseInt(request.body.lectureNum);
	var lecture_id = '/l/' + courseId + lecture_num;
	
	for (var i = 1; i <=10; i++) {
		var question = request.body["question" + i];

		if (question){

			var question_id = '/q/' + courseId + i;
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

			// insert values into answers table
			for (var j = 0; j < 4; j++) {
				conn.query('INSERT INTO answers (question_id, class_id, correct, answer) VALUES ($1, $2, $3, $4);', [question_id, lecture_id, correct[j], answers[j]]).on('error', console.error);
			}
		}
	}
	
	//add this class to the course_class table
	conn.query('INSERT INTO course_classes (class_id, course_id, class_order) VALUES ($1, $2, $3);', [lecture_id, courseId, lecture_num]).on('error', console.error);

	conn.query('INSERT INTO classes (class_id, class_title, video, class_description) VALUES ($1, $2, $3, $4);', [lecture_id, lectureTitle, video, lecture_desc]).on('error', console.error);

	// get current number of classes
	conn.query('SELECT num_classes FROM courses WHERE course_id = $1', [courseId], function(err, data) {
		if (err) throw err;
		var num_classes = data.rows[0].num_classes;
		if (data.rows.length == 0){
			//how should we handle this error?
			console.log("THERE HAS BEEN AN ERROR UPLOADING CLASS");
		}
		num_classes++;
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

// retrieve profile information (redundant)
app.get('/profile/:identifyer', function(request, response){
	var identifyer = request.params.identifyer;
	// select elements for profile
	var q = conn.query("SELECT * FROM user_info, classes, class_attendance WHERE user_info.user_id = $1", [identifyer], function(err, data){
		// send data to the front end as a response
		response.json(data.rows);
		// finish and close response
		response.end();
	});
	// print to console upon successful query completion
	q.on('end', function(){
		console.log('data successfuly sent');
	});
});


// set the app's server to listen on a given port
server.listen(port, function(){
	console.log('- Server listening on given port 1234');
});
