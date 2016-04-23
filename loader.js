var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create course class (multiple courses in a class) table
conn.query('CREATE TABLE IF NOT EXISTS course_classes (course_id INTEGER, course_class TEXT, course_order INTEGER, PRIMARY KEY (course_id));')
// create courses table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id INTEGER PRIMARY KEY AUTOINCREMENT, course_description TEXT, instructor TEXT, PRIMARY KEY (course_id), FOREIGN KEY (course_id) REFERENCES course_classes);').on('error', console.error).on('end', function(){
	console.log('courses table successfully created');
});
// create course information table
conn.query('CREATE TABLE IF NOT EXISTS course_attendance (user_id INTEGER, course_id INTEGER, course_class TEXT, active INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id), FOREIGN KEY (user_id) REFERENCES user_info(id));').on('error', console.error).on('end', function(){
	console.log('course_info table successfully created');
});
// create course progress table
conn.query('CREATE TABLE IF NOT EXISTS course_progress (user_id INTEGER, course_class TEXT, progress INTEGER)')
