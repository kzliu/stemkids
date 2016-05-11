var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, age INTEGER, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER, password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create course table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id TEXT, num_classes INTEGER, course_description TEXT, course_title TEXT, active INTEGER, PRIMARY KEY (course_id));').on('error', console.error).on('end', function(){
	console.log('course table successfully created');
});


// quiz table
// conn.query('CREATE TABLE IF NOT EXISTS quiz (quiz_id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer1 TEXT, answer2 TEXT, answer3 TEXT, answer4 TEXT, correct INTEGER);').on('error', console.error).on('end', function(){
// 	console.log('quiz table successfully created');
// });


// create classes table
conn.query('CREATE TABLE IF NOT EXISTS classes (class_id TEXT, class_title TEXT, class_description TEXT, instructor TEXT, video TEXT, handout TEXT, PRIMARY KEY (class_id));').on('error', console.error).on('end', function(){
	console.log('classes table successfully created');
});


// create class to course (multiple classes in a course) mapping
conn.query('CREATE TABLE IF NOT EXISTS course_classes (class_id TEXT, course_id TEXT, class_order INTEGER, PRIMARY KEY (course_id, class_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('course_classes table successfully created');
});

// create class information table
conn.query('CREATE TABLE IF NOT EXISTS enrollment (user_id INTEGER, course_id TEXT, completed INTEGER, progress INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('class_attendance table successfully created');
});

//quiz history for a user
conn.query('CREATE TABLE IF NOT EXISTS quiz_history (user_id INTEGER, answer_id INTEGER, question_id INTEGER, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (answer_id) REFERENCES answers(answer_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create course progress table, where values are inserted when a user completes a class
conn.query('CREATE TABLE IF NOT EXISTS course_history (user_id INTEGER, class_id TEXT, PRIMARY KEY (user_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create a questions table
conn.query('CREATE TABLE IF NOT EXISTS questions (question_id TEXT, class_id TEXT, question TEXT, PRIMARY KEY (question_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('questions table successfully created');
});


// create an answers table
conn.query('CREATE TABLE IF NOT EXISTS answers (answer_id INTEGER PRIMARY KEY AUTOINCREMENT, question_id TEXT, class_id TEXT, correct INTEGER, answer TEXT, FOREIGN KEY (question_id, class_id) REFERENCES questions(question_id, class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('answers table successfully created');
});



