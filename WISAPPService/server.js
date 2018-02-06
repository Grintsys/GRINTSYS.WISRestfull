var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
const sql = require('mssql')
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8090;
var router = express.Router();

const config = {
    user: 'wis',
    password: 'Grintsys2017',
    server: 'localhost',
    database: 'wis',
    port: 1433,
    debug: true,
    options: {
        encrypt: false,
        instanceName: 'SQLEXPRESS'
    }
};
// Middle Route 
router.use(function (req, res, next) {
    // do logging 
    // do authentication 
    console.log('Time:', Date.now());
    next(); // make sure we go to the next routes and don't stop here
});

/*
app.post('/api/login', function(req, res) {
    res.send({message: 'test post'});
});
*/

router.route('/grades/:gradeId.:sectionId.:studentId.:partial')
    .get(function(req, res){
        console.log('call ro api/grades');

        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.gradeId && req.params.sectionId && req.params.studentId && req.params.partial){
                var grade = req.params.gradeId;
                var section = req.params.sectionId;
                var student = req.params.studentId;
                var partial = req.params.partial;

                console.log('g: '+grade+ ' section: ' +section +' student: '+student+' p: '+partial);

                var request = pool.request()
                    .input('GraCodigo', grade)
                    .input('SeccCodigo', section)
                    .input('AluCodigo', student)
                    .input('Parcial', partial)
                    .query('select * \
                              from dbo.grades_v a\
                             where a.GraCodigo = @GraCodigo\
                               and a.SeccCodigo = @SeccCodigo\
                               and a.AluCodigo = @AluCodigo\
                               and a.parcial = @Parcial', (err, recordset) => {

                                if(err) console.log(err);
    
                                if(recordset.recordset.length > 0)
                                {
                                    var result = {
                                        success: true, 
                                        grades: recordset.recordsets
                                    };
                                } else {
                                    var result = {
                                        success: false,
                                        message: 'not record found'
                                    }; 
                                }
                        });
            }else {
                res.send({message:'error not fields are specified', success:false}); 
            }
        })
    })


router.route('/payments/:gradeId.:cod')
    .get(function(req, res){
        console.log('call to api/payments');
        const pool = new sql.ConnectionPool(config, err => {
            if (err) console.log(err);

            if(req.params.gradeId && req.params.cod){
                var grade = req.params.gradeId;
                var cod = req.params.cod;
                console.log('g: '+grade + ' c: '+cod);

                var request = pool.request()
                .input('GraCodigo', grade)
                .input('CoConPlan', cod)
                .query(' SELECT a.CoConcMes [Month],\
                                1 [Status],\
                                SUM(a.CoConcValor) Total\
                        FROM [wis].[dbo].[COCONCEPFACXANIOLEVEL1] a\
                        where Anio = year(getdate()) - 1\
                            and GraCodigo = @GraCodigo\
                            and CoConPlan = @CoConPlan\
                        GROUP BY CoConcMes', (err, recordset) => {

                            if(err) console.log(err);

                            if(recordset.recordset.length > 0)
                            {
                                var result = {
                                    success: true, 
                                    payments: recordset.recordsets
                                };
                            } else {
                                var result = {
                                    success: false,
                                    message: 'not record found'
                                }; 
                            }
                    });
            } else {
                res.send({message:'error not username specified', success:false}); 
            }
        })

        pool.on('error', err => {
            res.send({error: err, success:false });
        });
    });


router.route('/student/:username')
    .get(function(req, res){
        console.log('call to api/student');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.username){
                var username = req.params.username;
                console.log('U '+username);

                var request = pool.request()
                .input('UserCode', username)
                .query('SELECT distinct [AluCodigo]\
                        FROM [wis].[dbo].[USUARIOSALUMNOS]\
                        WHERE [UserCode] = @UserCode', (err, recordset) => {
                         if(err) console.log(err);

                         if(recordset.recordset.length > 0)
                         {
                            console.log("Success Login for "+recordset.recordset.length);

                            var result = {
                                success: true, 
                                users: recordset.recordsets
                            }; 
                            console.log(result);
                            res.send(result); 
                         } else {
                            var result = {
                                success: false, 
                                message: 'Wrong username'
                            }; 
                            console.log(result); 
                            res.send(result);     
                        }
                     })

            } else {
                res.send({message:'error not username specified', success:false}); 
            }
        });
        
        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })

router.route('/login')
    .post(function(req, res){

        console.log('Call to api/login ');

        const pool = new sql.ConnectionPool(config, err => {

            if (err) console.log(err);

            if(req.body.username && req.body.password)
            {
                    var username = req.body.username;
                    var password = req.body.password;

                    console.log("U: "+username+" P: "+password);

                    // create Request object
                    var request = pool.request()
                    .input('UserLogin', sql.NText, username)
                    .query('select top 1 * from dbo.USUARIOS WHERE UserLogin = @UserLogin', (err, recordset) => {
                
                        if (err) console.log(err);  
                        // send records as a response

                        if(recordset.recordset.length > 0)
                        {
                            console.log("Success Login for "+username);

                            var result = {
                                success: true, 
                                user: recordset.recordset[0]
                            }; 
                            console.log(result);
                            res.send(result); 
                        } else {
                            var result = {
                                success: false, 
                                message: 'Wrong username or password'
                            }; 
                            console.log(result); 
                            res.send(result);     
                        }

                    });
            }else{
                    res.send({message:'error not username or password', success:false}); 
            }
        });

        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })

router.route('/users').get(function (req, res) {

     console.log('Call to api/users ');

     const pool = new sql.ConnectionPool(config, err => {

        if (err) console.log(err);
    
        // create Request object
        var request = pool.request();
    
        // query to the database and get the records
        request.query('select * from dbo.USUARIOS', (err, recordset) => {
    
            if (err) console.log(err)
    
            // send records as a response
           res.send(recordset); 
        });
    });

    pool.on('error', err => {
        res.send({error: err});
    });
 });

 router.route('/homework/:gradeId.:sectionId').get(function (req, res) {

    console.log(`Call to api/homework/${req.params.gradeId}.${req.params.sectionId}`);

    const pool = new sql.ConnectionPool(config, err => {

       if (err) console.log(err);
  
       // create Request object
       var request = pool.request();
   
       var queryText = `SELECT trim(b.ClaDescrip) as [Subject]\
       ,trim(c.GraDescripcion) as [Grade]\
       ,trim(a.[TrabClassMatriculaDescrip]) as [Description]\
       ,a.[TrabClassmatriculaPeso] as [Value]\
       ,a.[TrabClassMatriculaFechEntre] as [Date]\
       ,abs(DATEDIFF(dd, a.[TrabClassMatriculaFechEntre], dateadd(mm, -1, GETDATE()))) [RemainTime]\
        FROM [dbo].[TRABAJOSCLASESMATRICULADASLEVE] a\
        inner join [dbo].CLASES b\
                on a.ClaCodigo = b.ClaCodigo\
        inner join [dbo].GRADOS c\
                on c.GraCodigo = a.GraCodigo \
  WHERE a.GraCodigo = ${req.params.gradeId} \
    and a.SeccCodigo = ${req.params.sectionId} \
    and a.TrabClassMatriculaFechMax >= dateadd(mm, -1, GETDATE())
  order by a.[TrabClassMatriculaFechEntre] desc`;

       //console.log(queryText);
       // query to the database and get the records
       request.query(queryText, (err, recordset) => {
   
           if (err) console.log(err)
   
           // send records as a response
          res.send(recordset.recordset); 
       });
   });

   pool.on('error', err => {
       res.send({error: err});
   });
});

 router.get('/logout', function(req, res, next) {
    if (req.session) {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
          return res.send({success:'true'});
        }
      });
    }
  });

//final configuration
app.use(cors());
app.use('/api', router);
app.listen(port);
console.log('REST API is runnning at ' + port);