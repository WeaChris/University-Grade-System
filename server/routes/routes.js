const express = require('express');
const { append } = require('express/lib/response');
const router = express.Router();
const server = require('../controllers/server.js');

//-----------------------GENERAL-------------------------
router.get('/home', server.viewHome);
router.post('/login', server.login);
router.post('/logout', server.authUser,server.logout);

//----------------------STUDENT--------------------------
router.post('/newStatements', server.authUser,server.newStatements);
router.get('/StudentProfile', server.authUser, server.viewStudentProfile);

//----------------------TEACHER--------------------------
router.post('/editTeaching', server.authUser,server.viewEditTeaching);
router.post('/deleteTeaching', server.authUser,server.deleteTeaching);
router.post('/updateTeaching', server.authUser,server.updateTeaching);
router.post('/deleteStatement', server.authUser,server.deleteStatement);
router.post('/updateStatement', server.authUser,server.updateStatement);
router.post('/editStatement', server.authUser,server.viewEditStatement);

//----------------------ADMIN---------------------------
router.post('/addLesson', server.authUser,server.addLesson);
router.post('/viewAddTeaching', server.authUser,server.viewAddTeaching);
router.post('/addTeaching', server.authUser,server.addTeaching);
router.post('/deleteTeacher', server.authUser,server.deleteTeacher);
router.post('/deleteStudent', server.authUser,server.deleteStudent);
router.post('/deleteTeaching2', server.authUser,server.deleteTeaching2);

module.exports = router;