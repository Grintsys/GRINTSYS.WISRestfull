const sql = require('mssql')
var uuid = require('node-uuid');
var async = require('async');

var config = {
    user: 'wis',
    password: 'Grintsys2017',
    server: 'localhost',
    database: 'wis',
    port: 1433,
    debug: true,
    options: {
        encrypt: false // Use this if you're on Windows Azure
        ,instanceName: 'SQLEXPRESS'
    }
}

// connect to your database
sql.connect(config, function (err) {

    if (err) console.log(err);

    // create Request object
    var request = new sql.Request();

    // query to the database and get the records
    request.query('select * from USUARIOS', function (err, recordset) {

        if (err) console.log(err)

        // send records as a response
       // res.send(recordset);
       console.log(recordset);

    });
});