var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create courses table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id INTEGER PRIMARY KEY AUTOINCREMENT, course_description TEXT, instructor TEXT);').on('error', console.error).on('end', function(){
	console.log('courses table successfully created');
});
// create course information table
conn.query('CREATE TABLE IF NOT EXISTS course_info (user_id INTEGER, course_id INTEGER, active INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id), FOREIGN KEY (user_id) REFERENCES user_info(id));').on('error', console.error).on('end', function(){
	console.log('course_info table successfully created');
});
