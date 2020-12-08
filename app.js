const express = require('express')
const app = express();
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({ path: './.env'});
app.use(express.urlencoded({extended: false}));
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect(err => {
    if(err){    
        console.log('Erro ao conectar ao banco de dados...')
        return err;
    }
    console.log('Conectado ao Banco de Dados!')
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.set('view engine', 'hbs');



app.get("/", (req, res) => {   
            
    db.query(`SELECT link, nomedaurl FROM urls WHERE permissao = 0 ORDER BY nomedaurl ASC`, (error, results) => {
        if(error){
            console.log(error);
        }
        if(results){
            return res.render('index',{
                destaques: results
            });
        }
    })
});

app.post('/register',(req, res) =>{

    db.query('SELECT email FROM usuarios WHERE email = ?', [req.body.email], (error, results) => {
        if(error){
        console.log(error);
        }
        if(!results.length == 0){
            console.log('E-mail já casdastrado!') 
            return res.render('index',{
                messageCadastro: 'E-mail já casdastrado'
            });
        }
        else if(req.body.senha != req.body.confirmacaoSenha){
                console.log('Campos de senha incompatíveis.')    
                return res.render('index',{
                    messageCadastro: 'Senhas incompatíveis'
                });  
            }
            else {
                db.query(`INSERT INTO usuarios (nome, email, senha) VALUES ('${req.body.nome}','${req.body.email}','${req.body.senha}')`, (err, result) =>{
                    if(err){
                        console.log('Erro ao tentar cadastrar novo usuario no Banco de Dados...')
                    }else{
                        console.log('Novo usuario cadastrado no Banco de Dados!')
                        return res.render('index',{
                            messageCadastro: 'E-mail casdastrado com sucesso!'
                        });
                    }
                });

            }

    }) 
});

app.post('/addLink',(req, res) =>{
    var permissao = 0;
    if(req.body.privado){
        permissao = parseInt(req.body.userId);
    }

    db.query(`INSERT INTO urls (link, nomedaurl, permissao) VALUES ('${req.body.link}','${req.body.nomeurl}',${permissao})`, (error, results) => {
        if(error){
        console.log(error);
        }
        else{

            db.query('SELECT url_id FROM urls ORDER BY url_id DESC LIMIT 0,1', (error, results) => {
                if(error){
                    console.log(error);
                }
                else{
                    console.log('Link adicionado ao banco de dados');
                    const aux = JSON.stringify(results[0]);
                    url_id = JSON.parse(aux);
                    var i = 0;
                    const tagLista = req.body.tags.split(";");  
                    for(i = 0; i < tagLista.length; i++){           
                        db.query(`INSERT INTO tags (url_id, descricao) VALUES (${url_id.url_id},'${tagLista[i]}')`, (err, result) =>{
                            if(err){
                                console.log('Erro ao tentar cadastrar tag');
                            }
                        });
                    }
                    
                    console.log('nova url cadastrada');

                    db.query(`SELECT link, nomedaurl FROM urls WHERE permissao = ${permissao} ORDER BY nomedaurl`, (error, results) => {
                        return res.render('profile',{
                        seusLinks: results,
                        nomeUsuario: req.body.userName,
                        IdUsuario: req.body.userId,
                        cadastroUrl: 'url cadastrada!'
                    })
                    
                    });
                }
            }) 
        }

    }) 
});

app.post('/login',(req, res) =>{

    db.query('SELECT nome, usuario_id FROM usuarios WHERE email = ? AND senha = ?', [req.body.email, req.body.senha], (error, results) => {
        if(error){
        console.log(error);
        }
        if(results.length == 0){
            console.log('Usuario não cadastrado') 
            return res.render('index',{
                messageLogin: 'Usuario não cadastrado'
            });
        }
        else{
            aux = JSON.stringify(results[0])
            dadosUsuario = JSON.parse(aux);
            db.query(`SELECT link, nomedaurl FROM urls WHERE permissao = ${dadosUsuario.usuario_id} ORDER BY nomedaurl`, (error, results) => {
                if(error){
                    console.log(error);
                }
                return res.render('profile',{ 
                    nomeUsuario: dadosUsuario.nome,
                    IdUsuario: dadosUsuario.usuario_id,
                    seusLinks: results
                });
            })
        }

    }) 
});

app.post('/buscar',(req, res) =>{

    db.query('SELECT url_id FROM tags WHERE descricao = ?', [req.body.busca], (error, results) => {
        if(error){
        console.log(error);
        }
        if(results.length == 0){
            return res.render('index',{
                resultados: false,
            });
        }
        else{
            let i = 0;
            let listaId = '';
            for(i = 0; i < results.length - 1; i++){
                const aux = JSON.stringify(results[i]);
                url_id = JSON.parse(aux);
                listaId = `${listaId} ${url_id.url_id},`;     
            }
            
            aux = JSON.stringify(results[results.length -1])
            url_id = JSON.parse(aux);
            listaId = `${listaId} ${url_id.url_id}`;

            db.query(`SELECT link, nomedaurl FROM urls WHERE url_id IN (${listaId}) AND permissao = 0`,  (error, results) => {
                if(error){
                console.log(error);
                }
                if(results.length == 0){
                        return res.render('index',{
                        resultados: false
                    });
                }

                if(results.length > 0){
                    return res.render('index',{
                        resultados: true,
                        busca: results
                    });
                }
            }) 
        }
    }) 

    
});
            

app.listen(3000)
 
