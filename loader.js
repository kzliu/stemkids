var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable
conn.query('CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});
// create class to course (multiple classes in a course) mapping
conn.query('CREATE TABLE IF NOT EXISTS course_classes (class_id INTEGER, course_id TEXT, class_order INTEGER, PRIMARY KEY (course_id), FOREIGN KEY (course_id) REFERENCES courses);')
// create classes table
conn.query('CREATE TABLE IF NOT EXISTS classes (class_id INTEGER PRIMARY KEY AUTOINCREMENT, class_description TEXT, instructor TEXT, PRIMARY KEY (class_id), FOREIGN KEY (class_id) REFERENCES course_classes);').on('error', console.error).on('end', function(){
	console.log('courses table successfully created');
});
// create course table
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id TEXT, num_classes INTEGER, course_description TEXT, PRIMARY KEY (course_id));')
// create class information table
conn.query('CREATE TABLE IF NOT EXISTS class_attendance (user_id INTEGER, class_id INTEGER, course_id TEXT, active INTEGER, PRIMARY KEY (user_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id), FOREIGN KEY (user_id) REFERENCES user_info(id));').on('error', console.error).on('end', function(){
	console.log('course_info table successfully created');
});
// create course progress table
//conn.query('CREATE TABLE IF NOT EXISTS course_progress (user_id INTEGER, course_id TEXT, progress INTEGER);');
