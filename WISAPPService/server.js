var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');
const sql = require('mssql')
var dotenv = require('dotenv')

const result = dotenv.config();
var app = express();

var port = parseInt(process.env.APP_PORT) || 8091;

app.use(cors());
app.use(methodOverride());
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


/* Database config env settings */
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    debug: true,
    //azure options
    options: {
        encrypt: false,
        instanceName: process.env.DB_INSTANCE_NAME || 'SQLEXPRESS'
    }
};


app.use(function(err, req, res, next){
    console.error(err);
    res.send({ success: false, message: err })
})


var server = app.listen(port, function(req, res, next){
    if (result.error) {
        throw result.error
    }
    console.log(`server running at - ${server.address().address}:${server.address().port}`);
    //console.log(result.parsed);

    console.log(config);
})

require('./grades')(app, sql, config);
require('./students')(app, sql, config);
require('./payments')(app, sql, config);
require('./grades')(app, sql, config);
require('./users')(app, sql, config);