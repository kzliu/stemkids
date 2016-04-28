var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER, password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create classes table
conn.query('CREATE TABLE IF NOT EXISTS classes (class_id TEXT, class_description TEXT, instructor TEXT, quiz_id INTEGER, lecture TEXT, handout TEXT, PRIMARY KEY (class_id), FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id));').on('error', console.error).on('end', function(){
	console.log('classes table successfully created');
});
// create course table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id TEXT, num_classes INTEGER, course_description TEXT, course_title TEXT, PRIMARY KEY (course_id));').on('error', console.error).on('end', function(){
	console.log('course table successfully created');
});

//quiz table
conn.query('CREATE TABLE IF NOT EXISTS quiz (quiz_id INTEGER PRIMARY KEY AUTOINCREMENT, class_id TEXT, question TEXT, answer1 TEXT, answer2 TEXT, answer3 TEXT, answer4 TEXT, correct INTEGER, FOREIGN KEY (class_id) REFERENCES classes(class_id));').on('error', console.error).on('end', function(){
	console.log('quiz table successfully created');
});

// create class to course (multiple classes in a course) mapping
conn.query('CREATE TABLE IF NOT EXISTS course_classes (class_id INTEGER, course_id TEXT, class_order INTEGER, PRIMARY KEY (course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id), FOREIGN KEY (class_id) REFERENCES classes(class_id));').on('error', console.error).on('end', function(){
	console.log('course_classes table successfully created');
});

// create class information table
conn.query('CREATE TABLE IF NOT EXISTS enrollment (user_id INTEGER, course_id TEXT, active INTEGER, progress INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id), FOREIGN KEY (user_id) REFERENCES user_info(user_id));').on('error', console.error).on('end', function(){
	console.log('class_attendance table successfully created');
});

//quiz history for a user
conn.query('CREATE TABLE IF NOT EXISTS quiz_history (user_id INTEGER, quiz_id TEXT, answer INTEGER, FOREIGN KEY (user_id) REFERENCES user_info(user_id), FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id));').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create course progress table, where values are inserted when a user completes a class
conn.query('CREATE TABLE IF NOT EXISTS course_history (user_id INTEGER, class_id TEXT, PRIMARY KEY (user_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id), FOREIGN KEY (user_id) REFERENCES user_info(user_id));');


