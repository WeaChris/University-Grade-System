const mysql = require('mysql');
const express = require('express');
const { append, render } = require('express/lib/response');
const syncSql = require('sync-sql');
const handlebars = require("handlebars");

var currentUser = null;
var lesson_id = null;
const app = express();

//create connection with mysql
const connection = mysql.createConnection({
    //connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'icaruswebsiteproject2'
});

connection.connect();



//VIEW HOME PAGE
exports.viewHome = (req, res) => {
    res.render('home', { req });
}
exports.viewRegister = (req, res) => {
    res.render('register');
}
//STUDENTS HOME
exports.viewStudentsHome = async (req, res) => {
    const array = await getFirstTableInfoForStudentsHome(currentUser);
    const student = await getNameforStudentHome(currentUser);
    const lessons = await getSecondTableInfoForStudentsHome();
    const passedlessons = await getThirdTableInfoForStudentsHome(currentUser);
    const teachingLessons = await getTeachingLessons();
    res.render('studentsHome', { array, lessons, student, passedlessons, teachingLessons });
}
//TEACHERS HOME
exports.viewTeachersHome = async (req, res) => {
    let teacher = await getNameforTeacherHome(currentUser);
    const firstTable = await getFirstTableInfoForTeachersHome(teacher[0].id);
    const students = await getAllStudents();
    let thirdTable = await getInfoForTeachersHomeTable3(currentUser);
    res.render('teachersHome', { teacher, firstTable, students, thirdTable });
}

exports.viewAdminHome = async (req, res) => {
    const admin = await getAdmin(currentUser);
    const thirdTable = await getThirdTableInfoForAdminHome();
    const students = await getAllStudents();
    const teachers = await getAllTeachers();
    res.render('adminHome', { admin, thirdTable, students, teachers })
}

exports.viewStudentProfile = async (req, res) => {
    const student = await getNameforStudentHome(currentUser);
    res.render('studentProfile', { student });
}

exports.viewEditTeaching = async (req, res) => {
    const { id } = req.body;
    try {
        teaching = await getTeachingbyid(id);
        var dictionary = {
            id: null,
            lessonName: "",
            semester: "",
            year: null,
            theory_multi: null,
            lab_multi: null,
            theory_restriction: null,
            lab_restriction: null
        };// se kathe for ftiaxnoyme ena dictionary gia na apothikeuoyme ta tis plirofories tou table poy tha theloyme na valoyme sto map 
        dictionary.id = teaching.id;
        dictionary.semester = teaching.semester;
        dictionary.year = teaching.year;
        dictionary.theory_multi = teaching.theory_multi;
        dictionary.lab_multi = teaching.lab_multi;
        dictionary.theory_restriction = teaching.theory_restriction;
        dictionary.lab_restriction = teaching.lab_restriction;
        lesson_name = await getLessonById(teaching.lesson_id);
        //to apo8ikeuw se global metavliti gia otan ua ginei to update na min kanw kai allo query 
        lesson_id = teaching.lesson_id

        dictionary.lessonName = lesson_name.name;

        res.render('editTeaching', { dictionary });
    } catch (err) {
        console.log(err.message)
    }


}

exports.updateTeaching = (req, res) => {
    let { id, semester, year, theory_multi, lab_multi, theory_restriction, lab_restriction } = req.body;
    console.log(id, semester, year, theory_multi, lab_multi, theory_restriction, lab_restriction);
    try {
        return new Promise(function (resolve, reject) {
            connection.query('UPDATE teaching SET year = ? , semester = ? , theory_multi = ? , lab_multi = ? , theory_restriction = ? , lab_restriction = ? WHERE id = ?;', [year, semester, theory_multi, lab_multi, theory_restriction, lab_restriction, id], async (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    let teacher = await getNameforTeacherHome(currentUser);
                    const firstTable = await getFirstTableInfoForTeachersHome(teacher[0].id);
                    const students = await getAllStudents();
                    let thirdTable = await getInfoForTeachersHomeTable3(currentUser);
                    res.render('teachersHome', { teacher, firstTable, students, thirdTable });
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }

}

exports.deleteTeaching = (req, res) => {
    const id = req.body;

    try {
        return new Promise(function (resolve, reject) {
            connection.query('DELETE FROM teaching WHERE id = ?', [id.id], async (err, result) => {
                if (err) {
                    reject(err);
                } else {

                    //      TEACHERS HOME !!!!!!!!!!!!!!!!!!
                    let teacher = await getNameforTeacherHome(currentUser);
                    const firstTable = await getFirstTableInfoForTeachersHome(teacher[0].id);
                    const students = await getAllStudents();
                    let thirdTable = await getInfoForTeachersHomeTable3(currentUser);
                    res.render('teachersHome', { teacher, firstTable, students, thirdTable });
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.deleteTeaching2 = (req, res) => {
    const id = req.body;
    console.log(id)
    try {
        return new Promise(function (resolve, reject) {
            try{
                connection.query('DELETE FROM teaching WHERE id = ?', [id.id], async (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        const admin = await getAdmin(currentUser);
                        const thirdTable = await getThirdTableInfoForAdminHome();
                        const students = await getAllStudents();
                        const teachers = await getAllTeachers();
                        res.render('adminHome', { admin, thirdTable, students, teachers })
                    }
                })
            }catch(err2){
                console.log(err2.message);
            }
            
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.authUser = (req, res, next) => {
    if (currentUser == null) {
        res.status(403)
        return res.render('home')
    }
    console.log("got here");
    next();
}

exports.login = async (req, res, next) => {
    let rows = [];
    const { username, password } = req.body;

    try {
        rows = await searchUser(username, password);
        if (rows == []) {
            this.viewHome("Failed to Authenticate", res);
        } else {
            currentUser = rows[0].id;  //an vrei user tha ton kanei set sto currentUser 
            console.log(currentUser);
            if (rows[0].status_id == 1) {
                this.viewAdminHome(req, res)
            } else if (rows[0].status_id == 2) {
                console.log(currentUser);
                this.viewStudentsHome(req, res);
            } else if (rows[0].status_id == 3) {
                this.viewTeachersHome(req, res);
            }


        }
    } catch (err) {
        console.log(err.message);
        this.viewHome("Failed to Authenticate", res);
    }

}

exports.logout = async (req, res) => {
    currentUser = null;
    this.viewHome(req, res);

}
exports.newStatements = async (req, res, next) => {
    const lessons = req.body;

    let teachings;
    for (i in lessons) {

        teachings = await getTeachingbylesson_id(lessons[i]);

        await createStatements(teachings);
    }
    //create statement

    this.viewStudentsHome(req, res);

}

async function getAdmin(currentUser) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM admin WHERE id=?', [currentUser], async (err, admin) => {
                if (!admin) {
                    reject(err);
                } else {
                    resolve(admin[0]);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.addLesson = (req, res) => {
    const { id, name, description } = req.body

    try {
        return new Promise(function (resolve, reject) {
            connection.query('INSERT INTO lesson VALUES (? , ? , ?)', [id, name, description], async (err) => {
                if (err) {
                    reject(err);
                } else {
                    //INSTEAD OF CALLING ADMINS HOME BEACUSE ITS NOT WORKING
                    const admin = await getAdmin(currentUser);
                    const thirdTable = await getThirdTableInfoForAdminHome();
                    const students = await getAllStudents();
                    const teachers = await getAllTeachers();
                    res.render('adminHome', { admin, thirdTable, students, teachers })
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.viewAddTeaching = async (req, res) => {
    const lessons = await getLessons()
    const teachers = await getTeachers()
    lesson_names = []
    teacher_surnames = []
    for (x in lessons) {
        lesson_names.push(lessons[x].name)
    }
    for (x in teachers) {
        teacher_surnames.push(teachers[x].surname)
    }
    console.log(lesson_names)
    console.log(teacher_surnames)
    res.render('addTeaching', { lesson_names, teacher_surnames })
}


exports.addTeaching = async (req, res) => {
    const { id, lesson_name, year, semester, teacher_name, theory_multi, lab_multi, theory_restriction, lab_restriction } = req.body
    console.log(lesson_name)
    console.log(teacher_name)
    const lesson_id = await getLessonIdByName(lesson_name)
    const teacher_id = await getTeacherByName(teacher_name)
    try {
        return new Promise(function (resolve, reject) {
            try {
                connection.query('INSERT INTO `teaching`(`id`, `lesson_id`, `year`, `semester`, `teacher_id`, `theory_multi`, `lab_multi`, `theory_restriction`, `lab_restriction`) VALUES (?,?,?,?,?,?,?,?,?)', [id, lesson_id.id, year, semester, teacher_id.id, theory_multi, lab_multi, theory_restriction, lab_restriction], async (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        const admin = await getAdmin(currentUser);
                        const thirdTable = await getThirdTableInfoForAdminHome();
                        const students = await getAllStudents();
                        const teachers = await getAllTeachers();
                        res.render('adminHome', { admin, thirdTable, students, teachers })
                    }

                })
            } catch (err2) {
                console.log(err2.message);
            }

        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.deleteTeacher = (req, res) => {
    const { id } = req.body
    try {
        return new Promise(function (resolve, reject) {
            connection.query('DELETE FROM teaching WHERE id = ?', [id.id], async (err) => {
                if (err) {
                    reject(err);
                } else {
                    const admin = await getAdmin(currentUser);
                    const thirdTable = await getThirdTableInfoForAdminHome();
                    const students = await getAllStudents();
                    const teachers = await getAllTeachers();
                    res.render('adminHome', { admin, thirdTable, students, teachers })
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.deleteStudent = (req, res) => {
    const { id } = req.body

    try {
        return new Promise(function (resolve, reject) {
            connection.query('DELETE FROM teaching WHERE id = ?', [id.id], async (err) => {
                if (err) {
                    reject(err);
                } else {
                    //INSTEAD OF CALLING ADMINS HOME BEACUSE ITS NOT WORKING
                    const admin = await getAdmin(currentUser);
                    const thirdTable = await getThirdTableInfoForAdminHome();
                    const students = await getAllStudents();
                    const teachers = await getAllTeachers();
                    res.render('adminHome', { admin, thirdTable, students, teachers })
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function getLessonIdByName(lesson_name) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT id FROM lesson WHERE name=?', [lesson_name], async (err, id) => {
                if (!id) {
                    reject(err);
                } else {
                    resolve(id[0]);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function getTeacherByName(teacher_name) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT id FROM teacher WHERE surname=?', [teacher_name], async (err, id) => {
                if (!id) {
                    reject(err);
                } else {
                    resolve(id[0]);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getTeachingbyid(teaching_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teaching WHERE id=?', [teaching_id], async (err, teaching) => {
                if (!teaching) {
                    reject(err);
                } else {
                    resolve(teaching[0]);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getLessonById(lesson_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT name FROM lesson WHERE id= ?;', [lesson_id], function (err, lesson) {
                if (!err) {
                    if (lesson == undefined) {

                        reject(new Error("undefined"))
                    } else {
                        resolve(lesson[0]);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function searchUser(username, password) {

    let info = new Map(); // map info example [1,{name:"", }]
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT id, status_id FROM user WHERE username= ? AND password = ?;', [username, password], function (err, rows) {
                if (!err) {
                    if (rows == undefined) {

                        reject(new Error("undefined"))
                    } else {

                        resolve(rows);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }

}

async function getTableInfoForStudentsHomeStatements(studentid) {

    let info = new Map(); // map info example [1,{name:"", }]
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT id, teaching_id, student_id, theory_grade, lab_grade, final_grade FROM statement WHERE student_id= ?;', [studentid], function (err, statements) {
                if (!err) {
                    if (statements == undefined) {

                        reject(new Error("undefined"))
                    } else {

                        resolve(statements);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }




}

async function getTableInfoForStudentsTeaching(teaching_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT lesson_id, semester FROM teaching WHERE teaching.id= ?', [teaching_id], async (err, teaching) => {
                if (!err) {
                    if (teaching == undefined) {

                        reject(new Error("undefined"))
                    } else {

                        resolve(teaching);
                    }
                }
            })
        })

    } catch (err) {

        console.log(err.message);
    }

}

async function getTableInfoForStudentslesson(lesson_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT name FROM lesson WHERE lesson.id= ?', [lesson_id], async (err, lesson) => {
                if (!err) {
                    if (lesson == undefined) {

                        reject(new Error("undefined"))
                    } else {
                        resolve(lesson);
                    }
                }
            })
        })

    } catch (err) {

        console.log(err.message);
    }

}

async function getSecondTableInfoForStudentsHome() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM lesson ', async (err, lessons) => {
                if (!err) {
                    if (lessons == undefined) {
                        reject(new Error("undefined"))
                    } else {
                        resolve(lessons);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }

}

async function getThirdTableInfoForStudentsHome(studentid) {
    let dictionary = await getFirstTableInfoForStudentsHome(studentid);
    let fixedDictionary = [];
    for (i in dictionary) {
        if (dictionary[i].final_grade > 5) {
            fixedDictionary.push(dictionary[i]);
        }
    }
    return fixedDictionary;
}

async function getAllTeachings() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT lesson_id FROM teaching', async (err, lessonTeachings) => {
                if (!err) {
                    if (lessonTeachings == undefined) {
                        reject(new Error("undefined"))
                    } else {
                        resolve(lessonTeachings);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getAllTeachers() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teacher', async (err, teachers) => {
                if (!err) {
                    if (teachers == undefined) {
                        reject(new Error("undefined"))
                    } else {
                        resolve(teachers);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getTeachingbylesson_id(lesson_id) {

    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT id FROM teaching WHERE lesson_id=?', [lesson_id], async (err, teaching_id) => {
                if (!err) {
                    if (teaching_id == undefined) {
                        reject(new Error("undefined"))
                    } else {
                        console.log(teaching_id[0])
                        resolve(teaching_id[0]);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

//To return einai array me dictionaries, ta dictinaries exoyn 
//lesson_name kai statements poy statements einai array me dictionaries
async function getInfoForTeachersHomeTable3(teacher_id) {
    infoForTable = [];
    let teachings = await getTeachingsbyTeacher_id(teacher_id);
    for (i in teachings) {
        let lesson = await getLessonById(teachings[i].lesson_id);
        let statements = await getStatementsByTeachingId(teachings[i].id);
        let statementsValues = [];

        let statementsInfoForEveryTeaching = {
            lesson_name: '',
            statements: []
        };

        for (y in statements) {
            let dictionary = {
                statement_id: "",
                student_name: "",
                student_surname: "",
                theory_grade: "",
                lab_grade: "",
                final_grade: ""
            };
            let student = await getStudentById(statements[y].student_id);

            dictionary.student_name = student.name;
            dictionary.student_surname = student.surname;
            dictionary.statement_id = statements[y].id;
            dictionary.theory_grade = statements[y].theory_grade;
            dictionary.lab_grade = statements[y].lab_grade;
            dictionary.final_grade = statements[y].final_grade;
            statementsValues.push(dictionary);
        }

        statementsInfoForEveryTeaching.lesson_name = lesson.name;
        statementsInfoForEveryTeaching.statements = statementsValues;
        infoForTable.push(statementsInfoForEveryTeaching)
    }

    return infoForTable;

}


async function getTeachingsbyTeacher_id(teacher_id) {

    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teaching WHERE teacher_id=?', [teacher_id], async (err, teachings) => {
                if (!err) {
                    if (teachings == undefined) {
                        reject(new Error("undefined"))
                    } else {

                        resolve(teachings);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getTeachingLessons() {
    let lesson_ids = await getAllTeachings();

    let fixedLessons = [];
    for (i in lesson_ids) {
        let lesson = await getLesson(lesson_ids[i].lesson_id);
        fixedLessons.push(lesson);
    }


    return fixedLessons;
}

async function getLesson(lesson_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM lesson WHERE id= ?;', [lesson_id], async (err, lesson) => {
                if (!err) {
                    if (lesson == undefined) {
                        reject(new Error("undefined"))
                    } else {

                        resolve(lesson[0]);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function getLessons() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM lesson', async (err, lessons) => {
                if (!err) {
                    if (lessons == undefined) {
                        reject(new Error("undefined"))
                    } else {

                        resolve(lessons);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function getTeachers() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teacher', async (err, teachers) => {
                if (!err) {
                    if (teachers == undefined) {
                        reject(new Error("undefined"))
                    } else {

                        resolve(teachers);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getNameforStudentHome(currentUser) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM student WHERE id= ?', [currentUser], async (err, student) => {
                if (!err) {
                    if (student == undefined) {
                        reject(new Error("undefined"))
                    } else {

                        resolve(student);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getNameforTeacherHome(currentUser) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teacher WHERE id= ?', [currentUser], async (err, teacher) => {
                if (!err) {
                    if (teacher == undefined) {
                        console.log("1 here is :")
                        reject(new Error("undefined"))
                    } else {

                        resolve(teacher);
                    }
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}


async function createStatements(teachind_id) {

    try {
        return new Promise(function (resolve, reject) {
            connection.query('INSERT INTO statement(id, teaching_id, student_id, theory_grade, lab_grade, final_grade) VALUES (?,?,?,?,?,?)', [null, teachind_id.id, currentUser, 0, 0, 0], async (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(err);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getFirstTableInfoForStudentsHome(currentUser) {
    let info = new Map();
    let array = [];

    let statements = await getTableInfoForStudentsHomeStatements(currentUser);

    for (i in statements) {
        var dictionary = {
            id: null,
            lessonName: "",
            semester: "",
            theory_grade: null,
            lab_grade: null,
            final_grade: null
        };// se kathe for ftiaxnoyme ena dictionary gia na apothikeuoyme ta tis plirofories tou table poy tha theloyme na valoyme sto map 

        dictionary.id = statements[i].id;
        dictionary.theory_grade = statements[i].theory_grade;
        dictionary.lab_grade = statements[i].lab_grade;
        dictionary.final_grade = statements[i].final_grade;
        let teaching = await getTableInfoForStudentsTeaching(statements[i].teaching_id);
        dictionary.semester = teaching[0].semester;
        let lesson = await getTableInfoForStudentslesson(teaching[0].lesson_id);
        dictionary.lessonName = lesson[0].name;
        array.push(dictionary);
        info.set(i, dictionary);
    }

    return array;

}

async function getThirdTableInfoForAdminHome() {
    let array = [];
    const teachingLessons = await getTeachings();

    for (i in teachingLessons) {
        var dictionary = {
            id: null,
            lesson_name: "",
            teacher_name: "",
            semester: "",
            year: null,
            theory_multi: null,
            lab_multi: null,
            theory_restriction: null,
            lab_restriction: null
        };// se kathe for ftiaxnoyme ena dictionary gia na apothikeuoyme ta tis plirofories tou table poy tha theloyme na valoyme sto map 
        dictionary.id = teachingLessons[i].id;
        dictionary.semester = teachingLessons[i].semester;
        dictionary.year = teachingLessons[i].year;
        dictionary.theory_multi = teachingLessons[i].theory_multi;
        dictionary.lab_multi = teachingLessons[i].lab_multi;
        dictionary.theory_restriction = teachingLessons[i].theory_restriction;
        dictionary.lab_restriction = teachingLessons[i].lab_restriction;
        const lesson = await getLesson(teachingLessons[i].lesson_id);
        const teacher = await getNameforTeacherHome(teachingLessons[i].teacher_id)
        dictionary.lesson_name = lesson.name;
        dictionary.teacher_name = teacher[0].surname;
        array.push(dictionary);

    }

    return array;
}

async function getFirstTableInfoForTeachersHome(teacher_id) {

    let array = [];
    const teachingLessonsById = await getTeachingsbyTeacher_id(teacher_id);

    for (i in teachingLessonsById) {
        var dictionary = {
            id: null,
            lessonName: "",
            semester: "",
            year: null,
            theory_multi: null,
            lab_multi: null,
            theory_restriction: null,
            lab_restriction: null
        };// se kathe for ftiaxnoyme ena dictionary gia na apothikeuoyme ta tis plirofories tou table poy tha theloyme na valoyme sto map 
        dictionary.id = teachingLessonsById[i].id;
        dictionary.semester = teachingLessonsById[i].semester;
        dictionary.year = teachingLessonsById[i].year;
        dictionary.theory_multi = teachingLessonsById[i].theory_multi;
        dictionary.lab_multi = teachingLessonsById[i].lab_multi;
        dictionary.theory_restriction = teachingLessonsById[i].theory_restriction;
        dictionary.lab_restriction = teachingLessonsById[i].lab_restriction;
        const lesson = await getLesson(teachingLessonsById[i].lesson_id);
        dictionary.lessonName = lesson.name;
        console.log(dictionary);
        array.push(dictionary);

    }

    return array;

}

async function getAllStudents() {

    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM student', async (err, students) => {
                if (!students) {
                    reject(err);
                } else {
                    resolve(students);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getStudentById(student_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT name, surname FROM student WHERE id = ?', [student_id], async (err, student) => {
                if (!student) {
                    reject(err);
                } else {
                    resolve(student[0]);
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getStatementsByTeachingId(teaching_id) {

    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM statement WHERE teaching_id = ?', [teaching_id], async (err, statements) => {
                if (!statements) {
                    reject(err);
                } else {
                    resolve(statements);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

async function getStatementById(statement_id) {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM statement WHERE id = ?', [statement_id], async (err, statement) => {
                if (!statement) {
                    reject(err);
                } else {
                    resolve(statement[0]);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}
async function getTeachings() {
    try {
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM teaching ', async (err, teachings) => {
                if (!teachings) {
                    reject(err);
                } else {
                    resolve(teachings);
                }

            })
        })

    } catch (err) {
        console.log(err.message);
    }
}

exports.viewEditStatement = async (req, res) => {
    const { id } = req.body;
    try {
        statement = await getStatementById(id);
        teaching = await getTeachingbyid(statement.teaching_id)
        lesson = await getLessonById(teaching.lesson_id)
        student = await getStudentById(statement.student_id)
        var dictionary = {
            statement_id: statement.id,
            lesson_name: lesson.name,
            student_name: student.name,
            student_surname: student.surname,
            theory_grade: statement.theory_grade,
            lab_grade: statement.lab_grade
        }
        res.render('editStatement', { dictionary })
    } catch (err) {
        console.log(err.message)
    }

}
exports.updateStatement = async (req, res) => {
    let { statement_id, theory_grade, lab_grade } = req.body;
    try {
        const statement = await getStatementById(statement_id)
        console.log('getting here 1')
        const teaching = await getTeachingbyid(statement.teaching_id)
        console.log('getting here 2')
        const theory_multi = teaching.theory_multi
        const lab_multi = teaching.lab_multi
        const final_grade = theory_multi * theory_grade + lab_multi * lab_grade;

        return new Promise(function (resolve, reject) {
            connection.query('UPDATE statement SET theory_grade = ? , lab_grade= ?, final_grade = ? WHERE id = ?;', [theory_grade, lab_grade, final_grade, statement_id], async (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    let teacher = await getNameforTeacherHome(currentUser);
                    const firstTable = await getFirstTableInfoForTeachersHome(teacher[0].id);
                    const students = await getAllStudents();
                    let thirdTable = await getInfoForTeachersHomeTable3(currentUser);
                    res.render('teachersHome', { teacher, firstTable, students, thirdTable });
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }

}

exports.deleteStatement = (req, res) => {
    const id = req.body;

    try {
        return new Promise(function (resolve, reject) {
            connection.query('DELETE FROM statement WHERE id = ?', [id.id], async (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    //      TEACHERS HOME !!!!!!!!!!!!!!!!!!
                    let teacher = await getNameforTeacherHome(currentUser);
                    const firstTable = await getFirstTableInfoForTeachersHome(teacher[0].id);
                    const students = await getAllStudents();
                    let thirdTable = await getInfoForTeachersHomeTable3(currentUser);
                    res.render('teachersHome', { teacher, firstTable, students, thirdTable });
                }
            })
        })

    } catch (err) {
        console.log(err.message);
    }
}


