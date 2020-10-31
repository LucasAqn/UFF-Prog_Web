const express = require('express')
const app = express()
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'urruL'
});

connection.connect(err => {
    if(err){    
        return err;
    }
});


app.post('/login',(req, res) =>{
    connection.query(`SELECT name, id FROM user WHERE email = "${req.body.email}" AND senha = "${req.body.senha}"`, (err, rows) =>{
        if(err){
            res.status(500).send()
        }
        if(rows[0] === undefined){
            res.status(401).send()
        }
        if(rows[0].name){
            res.status(200).send()
            return;
        }
    });
});
 
app.listen(3000)
