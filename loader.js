var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, age INTEGER, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER, password TEXT, logged_in INTEGER);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create course table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id TEXT, num_classes INTEGER, course_description TEXT, course_title TEXT, PRIMARY KEY (course_id));').on('error', console.error).on('end', function(){
	console.log('course table successfully created');
});


//quiz table
// conn.query('CREATE TABLE IF NOT EXISTS quiz (quiz_id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer1 TEXT, answer2 TEXT, answer3 TEXT, answer4 TEXT, correct INTEGER);').on('error', console.error).on('end', function(){
// 	console.log('quiz table successfully created');
// });


// create classes table
conn.query('CREATE TABLE IF NOT EXISTS classes (class_id TEXT, class_description TEXT, instructor TEXT, quiz_id INTEGER, lecture TEXT, handout TEXT, PRIMARY KEY (class_id), FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('classes table successfully created');
});


// create class to course (multiple classes in a course) mapping
conn.query('CREATE TABLE IF NOT EXISTS course_classes (class_id INTEGER, course_id TEXT, class_order INTEGER, PRIMARY KEY (course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('course_classes table successfully created');
});

// create class information table
conn.query('CREATE TABLE IF NOT EXISTS enrollment (user_id INTEGER, course_id TEXT, active INTEGER, progress INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('class_attendance table successfully created');
});

//quiz history for a user
conn.query('CREATE TABLE IF NOT EXISTS quiz_history (user_id INTEGER, quiz_id TEXT, answer INTEGER, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create course progress table, where values are inserted when a user completes a class
conn.query('CREATE TABLE IF NOT EXISTS course_history (user_id INTEGER, class_id TEXT, PRIMARY KEY (user_id, answer_id), FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create a questions table
conn.query('CREATE TABLE IF NOT EXISTS questions (question_id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, class_id, FOREIGN KEY (class_id) REFERENCES classes(class_id));').on('error', console.error).on('end', function(){
	console.log('questions table successfully created');
});


// create an answers table
conn.query('CREATE TABLE IF NOT EXITSTS answers (answer_id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER, correct INTEGER, FOREIGN KEY (question_id) REFERENCES questions(question_id));').on('error', console.error).on('end', function(){
	console.log('answers table successfully created');
});



