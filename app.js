const routes = require('./server/routes/routes');
const express = require('express');
const mysql = require('mysql');
const bodyParser=require("body-parser");
const exphbs = require("express-handlebars");
const handlebars = require("handlebars");

const app = express();

app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

handlebars.registerHelper('eachInMap', function (map, block) {
    var out = '';
    Object.keys(map).map(function (prop) {
        out += block.fn({ key: prop, value: map[prop] });
    });
    return out;
});

//create connection with mysql
const database = mysql.createConnection({
    host: 'localhost',
    user: '',
    password: '',
    database: 'icaruswebsiteproject2'
});
//Connect
database.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('My sql connected...');
});

app.use('/', routes);

app.listen(port, ()=> console.log(`Listen on port ${port}`));