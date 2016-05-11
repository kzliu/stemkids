var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://stemkids.sqlite3');

// create user information datatable 
/*
user_id : autoincremented user_id
login : username for a user
first_name : user's first name
last_name: user's last name
age : user's age
grade : user's grade
school: user's school
gender : user's gender
email: user's email
phone_num: user's phone number
password: encrypted user password
*/
conn.query('CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, first_name TEXT, last_name TEXT, age INTEGER, grade TEXT, school TEXT, gender TEXT, email TEXT, phone_num INTEGER, password TEXT);').on('error', console.error).on('end', function(){
	console.log('user_info table successfully created');
});

// create course table
/*
course_id : 6-character, uniquely generated, course id
num_classes : number of classes in the course
course_description : description for a course
course_title : title of the course
active : 1 if course is active and available for students to take, 0 if the class is not active
*/
conn.query('CREATE TABLE IF NOT EXISTS courses (course_id TEXT, num_classes INTEGER, course_description TEXT, course_title TEXT, active INTEGER, PRIMARY KEY (course_id));').on('error', console.error).on('end', function(){
	console.log('course table successfully created');
});

// create classes table - this is the equivalent of a lecture in a course
/*
class_id: the class id is created with the following format: "/l/" + (6-character course code to which the class belongs) + class number (this is the order of the class as a module in the course)
class_title: title for a class
class_description: summary for the specific class
instructor: instructor of the class 
video: url for the video for the class
handout: file path for the handout stored on the file server
*/
conn.query('CREATE TABLE IF NOT EXISTS classes (class_id TEXT, class_title TEXT, class_description TEXT, instructor TEXT, video TEXT, handout TEXT, PRIMARY KEY (class_id));').on('error', console.error).on('end', function(){
	console.log('classes table successfully created');
});


// create class to course (multiple classes in a course) mapping
/*
class_id: class id for a class
course_id: course id for the course to which the class belongs
class_order: the order in which the class appears as a module in the course
*/
conn.query('CREATE TABLE IF NOT EXISTS course_classes (class_id TEXT, course_id TEXT, class_order INTEGER, PRIMARY KEY (course_id, class_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('course_classes table successfully created');
});

// create enrollment table
/*
user_id: id that corresponds to a user
course_id: id that corresponds to a course in which the user is enrolled (or has been enrolled and has completed)
completed: 0 if the user has not completed the course (which means finishing the quizzes for all the lectures), 1 if they have
progress: the class number for the current class a user has yet to take the quiz for in the course
*/
conn.query('CREATE TABLE IF NOT EXISTS enrollment (user_id INTEGER, course_id TEXT, completed INTEGER, progress INTEGER, PRIMARY KEY (user_id, course_id), FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('class_attendance table successfully created');
});

//quiz history for a user
/*
user_id: id that corresponds to a user
answer_id: id that corresponds to the answer a user marked for their quiz
question_id: id that corresponds to the question a user answered (with answer_id)
*/
conn.query('CREATE TABLE IF NOT EXISTS quiz_history (user_id INTEGER, answer_id INTEGER, question_id INTEGER, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (answer_id) REFERENCES answers(answer_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create course progress table, where values are inserted when a user completes a class
/*
user_id: id that corresponds to a user
class_id: class id corresponding to a class a user has completed (by finishing the quiz)
*/
conn.query('CREATE TABLE IF NOT EXISTS course_history (user_id INTEGER, class_id TEXT, PRIMARY KEY (user_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('quiz_history table successfully created');
});


// create a questions table
/*
question_id: id that corresponds to a question, this id is created with the following format: "/q/" + (6-character course code to which the question belongs) + question number (this is the order of question in the quiz for a specific lecture)
class_id: class id corresponding to a class the question belongs to
question: the question asked on the quiz
*/
conn.query('CREATE TABLE IF NOT EXISTS questions (question_id TEXT, class_id TEXT, question TEXT, PRIMARY KEY (question_id, class_id), FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('questions table successfully created');
});


// create an answers table
/*
answer_id: autoincremented answer id
question_id: question id to which the answer is an optional answer
class_id: class id corresponding to a class to which the answer belongs
correct: 0 if the answer is wrong, 1 if the answer is correct
answer: the answer to the question asked on the quiz
*/
conn.query('CREATE TABLE IF NOT EXISTS answers (answer_id INTEGER PRIMARY KEY AUTOINCREMENT, question_id TEXT, class_id TEXT, correct INTEGER, answer TEXT, FOREIGN KEY (question_id, class_id) REFERENCES questions(question_id, class_id) ON DELETE CASCADE ON UPDATE CASCADE);').on('error', console.error).on('end', function(){
	console.log('answers table successfully created');
});



