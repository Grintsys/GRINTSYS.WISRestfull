var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override')
var cors = require('cors');
const sql = require('mssql')
var app = express();

app.use(methodOverride())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)

function logErrors (err, req, res, next) {
    console.error(err.stack)
    next(err)
}

function clientErrorHandler (err, req, res, next) {
    if (req.xhr) {
      res.status(500).send({ error: 'Something failed!' })
    } else {
      next(err)
    }
}

function errorHandler (err, req, res, next) {
    res.status(500)
    res.render('error', { error: err })
}

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

//http://localhost:8090/api/grades/6.1.2015192.1
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

                var request = pool.request();

                var queryText = `select * \
                                   from dbo.grades_v\
                                  where GraCodigo = ${grade}\
                                    and SeccCodigo = ${section}\
                                    and AluCodigo = ${student}\
                                    and parcial = ${partial}`;

                    request.query(queryText, (err, recordset) => {

                                if(err) console.log(err);
    
                                if(recordset.recordset.length > 0)
                                {
                                    var result = {
                                        success: true, 
                                        grades: recordset.recordset
                                    };
                                } else {
                                    var result = {
                                        success: false,
                                        message: 'not record found'
                                    }; 
                                }

                                res.send(result);
                        });
            }else {
                res.send({message:'error not fields are specified', success:false}); 
            }
        })

        pool.on('error', err => {
            res.send({error: err, success: false });
        });
    })

router.route('/grades/average/:gradeId.:sectionId.:studentId.:partial')
    .get(function(req, res){
        console.log('call ro api/grades');

        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.gradeId && req.params.sectionId && req.params.studentId && req.params.partial){
                var grade = req.params.gradeId;
                var section = req.params.sectionId;
                var student = req.params.studentId;
                var partial = req.params.partial;

                console.log('grade: '+grade+ ' section: ' +section +' student: '+student+' partial: '+partial);

                var request = pool.request();

                var queryText = `select AVG(Total) as Average \
                                   from dbo.grades_v\
                                  where GraCodigo = ${grade}\
                                    and SeccCodigo = ${section}\
                                    and AluCodigo = ${student}\
                                    and parcial = ${partial}`;

                request.query(queryText, (err, recordset) => {

                        if(err) console.log(err);
    
                        if(recordset.recordset.length > 0)
                        {
                            var result = {
                                success: true, 
                                average: recordset.recordset[0].Average                                    
                            };
                        } else {
                            var result = {
                                success: false,
                                message: 'not record found'
                            }; 
                        }

                        res.send(result);
                });
            } else {
                res.send({message:'error not fields are specified', success:false}); 
            }
        })

        pool.on('error', err => {
            res.send({error: err, success:false });
        });
    })

    //payments/6.1
router.route('/payments/:gradeId.:cod')
    .get(function(req, res){
        console.log('call to api/payments');
        const pool = new sql.ConnectionPool(config, err => {
            if (err) console.log(err);

            if(req.params.gradeId && req.params.cod){
                var grade = req.params.gradeId;
                var cod = req.params.cod;

                console.log('grade: '+grade + ' code: '+cod);

                var request = pool.request();

                var queryText = `select trim(b.CoConcDescrip) [Description],
                                    a.CoConcValor [Total],
                                    a.CoConcFecha [Date],
                                    1 [IsOverdue]
                            from [wis].[dbo].[COCONCEPFACXANIOLEVEL1] a
                                 inner join [dbo].[COCONCEPFACTU] b on a.CoConcCodigo = b.CoConcCodigo
                            where Anio = year(getdate()) - 1
                                and GraCodigo = ${grade}
                                and CoConPlan = ${cod}
                            order by a.CoConcFecha asc`;                      
                        
                        request.query(queryText, (err, recordset) => {

                            if(err) return next(err);

                            if(recordset.recordset.length > 0)
                            {
                                var result = {
                                    success: true, 
                                    TotalDue: 7200,
                                    payments: recordset.recordset
                                };
                            } else {
                                var result = {
                                    success: false,
                                    message: 'not record found'
                                };
                            }

                            res.send(result);
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

                var request = pool.request();

                
                var queryText = `SELECT distinct [AluCodigo]\
                        FROM [wis].[dbo].[USUARIOSALUMNOS]\
                        WHERE [UserCode] = `+username;

                        console.log(queryText);
                        
                    request.query(queryText, (err, recordset) => {

                         if(err) console.log(err);

                         if(recordset.recordset.length > 0)
                         {
                            console.log("Success Login for "+recordset.recordset.length);

                            var result = {
                                success: true, 
                                users: recordset.recordsets
                            }; 
                         } else {
                            var result = {
                                success: false, 
                                message: 'Wrong username'
                            };  
                        }

                        res.send(result);
                     })

            } else {
                res.send({message:'error not username specified', success:false}); 
            }
        });
        
        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })

    router.route('/students/:username')
    .get(function(req, res){
        console.log('call to api/students');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.username){
                var username = req.params.username;
                console.log('Username: '+username);

                var request = pool.request();
                
                var queryText = ` SELECT distinct c.AluCodigo as StudentCode\
                                         ,trim(a.UserNombre) [Name]
                                    FROM [wis].[dbo].[USUARIOS] a\
                                        inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario\
                                        inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod\
                                    WHERE a.[UserCode] = '${username}' \
                                    and a.UserActivo = 'S'`;
                        
                    request.query(queryText, (err, recordset) => {

                         if(err) console.log(err);

                         if(recordset.recordset.length > 0)
                         {

                            var result = {
                                success: true, 
                                users: recordset.recordsets
                            }; 
                         } else {
                            var result = {
                                success: false, 
                                message: 'Wrong username'
                            };  
                        }

                        res.send(result);
                     })

            } else {
                res.send({message:'error not username specified', success:false}); 
            }
        });
        
        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })

router.route('/student/:username/data')
    .get(function(req, res){
        console.log('call to api/students');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.username){
                var username = req.params.username;
                console.log('Username: '+username);

                var request = pool.request();

                var queryText = `SELECT top 1 [GraCodigo] GradeId, 
                                    [SeccCodigo] SectionId 
                              FROM [wis].[dbo].[TRABAJOSCLASESEVALUARLEVEL1] A
                             WHERE AluCodigo = '${username}'
                             ORDER BY a.TrabClassEvaFecha desc`;

                        
                    request.query(queryText, (err, recordset) => {

                         if(err) console.log(err);

                         if(recordset.recordset.length > 0)
                         {

                            var result = {
                                success: true, 
                                data: recordset.recordset[0]
                            }; 
                         } else {
                            var result = {
                                success: false, 
                                message: 'Wrong username'
                            };  
                        }

                        res.send(result);
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
                    var request = pool.request();
                    
                    var queryText = `select distinct trim(a.UserCode) Username, b.AluCodigo
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                      WHERE trim(UserLogin) = trim('${username}')`;
                         
                    request.query(queryText, (err, recordset) => {
                
                        if (err) console.log(err);  
                        // send records as a response

                        if(recordset.recordset.length > 0)
                        {
                            console.log("Success Login for student "+username);

                            var result = {
                                success: true, 
                                users: recordset.recordset
                            }; 

                            res.send(result);
        
                        } else {

                            var request2 = pool.request();

                            var queryText = `SELECT distinct c.AluCodigo StudentCode, trim(a.UserNombre) [Name]
                                                FROM [wis].[dbo].[USUARIOS] a
                                                    inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                                    inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                                WHERE trim(USERCODE) = trim('${username}') 
                                                    and UserActivo = 'S'`;

                            request2.query(queryText, (err, recordset) => {

                                if (err) console.log(err);  
                                // send records as a response

                                if(recordset.recordset.length > 0)
                                {
                                    console.log("Success Login for familiy "+username);
        
                                    var result = {
                                        success: true, 
                                        users: recordset.recordset
                                    };                                        
                                } else{
                                    var result = {
                                        success: false, 
                                        message: 'Wrong username or password'
                                    };
                                }

                                res.send(result);
                            });  
                        }
                    });
            }else{
                    res.send({message:'error on username or password', success:false}); 
            }
        });

        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })

router.route('/login2/:username.:password')
    .get(function(req, res){

        console.log('Call to api/login2 ');

        const pool = new sql.ConnectionPool(config, err => {

            if (err) console.log(err);

            if(req.params.username && req.params.password)
            {
                    var username = req.params.username;
                    var password = req.params.password;

                    console.log("U: "+username+" P: "+password);

                    // create Request object
                    var request = pool.request();
                    
                    var queryText = `select distinct trim(a.UserCode) Username, b.AluCodigo
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                     WHERE trim(UserLogin) = trim('${username}')`;
                         
                    request.query(queryText, (err, recordset) => {
                
                        if (err) console.log(err);  
                        // send records as a response

                        if(recordset.recordset.length > 0)
                        {
                            console.log("Success Login for student "+username);

                            var result = {
                                success: true, 
                                users: recordset.recordset
                            }; 

                            res.send(result);
        
                        } else {

                            var request2 = pool.request();

                            var queryText = `SELECT distinct c.AluCodigo StudentCode, trim(a.UserNombre) [Name]
                                                FROM [wis].[dbo].[USUARIOS] a
                                                     inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                                     inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                                WHERE trim(USERCODE) = trim('${username}') 
                                                    and UserActivo = 'S'`;

                            request2.query(queryText, (err, recordset) => {

                                if (err) console.log(err);  
                                // send records as a response

                                if(recordset.recordset.length > 0)
                                {
                                    console.log("Success Login for familiy "+username);
        
                                    var result = {
                                        success: true, 
                                        users: recordset.recordset
                                    };                                        
                                } else {
                                    var result = {
                                        success: false, 
                                        message: 'Wrong username or password'
                                    };
                                }

                                res.send(result);
                            });  
                        }
                    });
            }else{
                    res.send({message:'error on username or password', success:false}); 
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
                        and a.TrabClassMatriculaFechMax >= dateadd(mm, -1, GETDATE())\
                        and b.ClaTipo = 'NO'
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