//get current courses
query = "SELECT course_description, course_title FROM enrollment AS e, courses AS c WHERE e.active=1 AND e.user_id=$1 AND e.course_id = c.course_id AND c.active=1;"

//get past courses
query = "SELECT course_description, course_title FROM enrollment AS e, courses AS c WHERE e.active=0 AND e.user_id=$1 AND e.course_id = c.course_id AND c.active=1;"

//insert class into table
// query = "INSERT INTO classes"