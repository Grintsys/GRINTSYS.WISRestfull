var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');
const sql = require('mssql')
var dotenv = require('dotenv')

const result = dotenv.config();
var router = express.Router();
var app = express();

var port = parseInt(process.env.APP_PORT) || 8091;

app.use(cors());
app.use('/api', router);
app.use(methodOverride());
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(clientErrorHandler);
app.use(errorHandler);

/* Error handler */
function clientErrorHandler (err, req, res, next) {
    console.error(err.stack)
    if (req.xhr) {
      res.status(500).send({ error: 'Something failed!' })
    } else {
      next(err)
    }
}

function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
  }

/* Database config env settings */
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    debug: true,
    options: {
        encrypt: false,
        instanceName: 'SQLEXPRESS'
    }
};

var server = app.listen(port, function(req, res, next){
    if (result.error) {
        throw result.error
    }
    console.log(`server running at - ${server.address().address}:${server.address().port}`);
    //console.log(result.parsed);

    console.log(config);
})

//http://localhost:8090/api/grades/6.1.2015192.1
router.get('/grades/:gradeId.:sectionId.:studentId.:partial', function(req, res, next){
        console.log('call ro api/grades');

        const pool = new sql.ConnectionPool(config, err => {
            if(err) next(err);

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

                                if(err) next(err);
    
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
            } else {
                res.send({message:'error not fields are specified', success:false}); 
            }
        })

        pool.on('error', err => {
            res.send({error: err, success: false });
        });
    })

router.get('/grades/average/:gradeId.:sectionId.:studentId.:partial', function(req, res, next){
        console.log('call ro api/grades');

        const pool = new sql.ConnectionPool(config, err => {
            if(err) next(err);

            if(req.params.gradeId && req.params.sectionId && req.params.studentId && req.params.partial){
                var grade = req.params.gradeId;
                var section = req.params.sectionId;
                var student = req.params.studentId;
                var partial = req.params.partial;

                console.log('grade: '+grade+ ' section: ' +section +' student: '+student+' partial: '+partial);

                var request = pool.request();

                var queryText = `select cast(AVG(cast(Total as float)) as decimal(9,1)) as Average \
                                   from dbo.grades_v\
                                  where GraCodigo = ${grade}\
                                    and SeccCodigo = ${section}\
                                    and AluCodigo = ${student}\
                                    and parcial = ${partial}`;

                request.query(queryText, (err, recordset) => {

                        if(err) next(err);
    
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
router.get('/payments/:gradeId.:cod', function(req, res, next){
        console.log('call to api/payments');
        const pool = new sql.ConnectionPool(config, err => {
            if (err) next(err);

            if(req.params.gradeId && req.params.cod){
                var grade = req.params.gradeId;
                var cod = req.params.cod;

                console.log('grade: '+grade + ' code: '+cod);

                var request = pool.request();

                var queryText = `select trim(b.CoConcDescrip) [Description],
                                    a.CoConcValor [Total],
                                    cast(a.CoConcFecha as date) [Date],
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
                                    TotalDue: 0,
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


router.get('/student/:usercode', function(req, res, next){
        console.log('call to api/student');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) next(err);

            if(req.params.usercode){
                var usercode = req.params.usercode;
                console.log('U '+usercode);

                var request = pool.request();

                
                var queryText = `SELECT distinct [AluCodigo]\
                        FROM [wis].[dbo].[USUARIOSALUMNOS]\
                        WHERE [UserCode] = '${usercode}'`;
                   
                    console.log(queryText);
                        
                    request.query(queryText, (err, recordset) => {

                         if(err) next(err);

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

    app.get('/students/:username', function(req, res){
        console.log('call to api/students');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) console.log(err);

            if(req.params.username){
                var username = req.params.username;
                console.log('Username: '+username);

                var request = pool.request();
                
                var queryText = ` SELECT distinct c.AluCodigo as StudentCode
                            ,trim(e.UserNombre) + ' ' + trim(e.UserApellido) [Name]
                  FROM [wis].[dbo].[USUARIOS] a
                      inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario
                      inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                      left join [wis].[dbo].[USUARIOSALUMNOS] d on d.AluCodigo = c.AluCodigo 
                      left join [wis].[dbo].[USUARIOS] e on e.UserCode = d.UserCode
                  WHERE a.[UserCode] = '${username}' 
                  and a.UserActivo = 'S'`;
                        
                    request.query(queryText, (err, recordset) => {

                         if(err) console.log(err);

                         if(recordset.recordset.length > 0)
                         {

                            var result = {
                                success: true, 
                                users: recordset.recordset
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

router.get('/student/:estudentcode/data', function(req, res, next){
        console.log('call to api/students');
        const pool = new sql.ConnectionPool(config, err => {
            if(err) next(err);

            if(req.params.estudentcode){
                var estudentcode = req.params.estudentcode;
                console.log('StudentCode: '+ estudentcode);

                var request = pool.request();

                var queryText = `select top 1 a.AluCodigo StudentCode, a.Gracodigo GradeId, a.SeccCodigo SectionId
                                   from dbo.[CLASESMATRICULADASLEVEL1] a 
                                  where a.AluCodigo = '${estudentcode}'
                                  order by GraCodigo desc`
                        
                    request.query(queryText, (err, recordset) => {

                         if(err) next(err);

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

router.post('/login', function(req, res, next){

        console.log('Call to api/login ');

        const pool = new sql.ConnectionPool(config, err => {

            if (err) next(err);

            if(req.body.username && req.body.password)
            {
                    var username = req.body.username;
                    var password = req.body.password;

                    console.log("U: "+username+" P: "+password);

                    // create Request object
                    var request = pool.request();
                    
                    var queryText = `select distinct trim(a.UserCode) Username, b.AluCodigo StudentCode
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                      WHERE trim(UserLogin) = trim('${username}') and trim(UserClave) = trim('${password}')`;
                         
                    request.query(queryText, (err, recordset) => {
                
                        if (err) next(err);  
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

                            var queryText = `SELECT distinct c.AluCodigo StudentCode, trim(a.UserCode) [Username]
                                                FROM [wis].[dbo].[USUARIOS] a
                                                    inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                                    inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                                WHERE trim(USERCODE) = trim('${username}') and trim(UserClave) = trim('${password}') 
                                                    and UserActivo = 'S'`;

                            request2.query(queryText, (err, recordset) => {

                                if (err) next(err);  
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

router.get('/login2/:username.:password', function(req, res, next){

        console.log('Call to api/login2 ');

        const pool = new sql.ConnectionPool(config, err => {

            if (err) next(err);

            if(req.params.username && req.params.password)
            {
                    var username = req.params.username;
                    var password = req.params.password;

                    console.log("U: "+username+" P: "+password);

                    // create Request object
                    var request = pool.request();
                    
                    var queryText = `select distinct trim(a.UserCode) Username, b.AluCodigo StudentCode
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                     WHERE trim(UserLogin) = trim('${username}') and trim(UserClave) = trim('${password}')
                                       and UserActivo = 'S'`;
                         
                    request.query(queryText, (err, recordset) => {
                
                        if (err) next(err);  
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

                            var queryText = `SELECT distinct c.AluCodigo StudentCode, trim(a.UserNombre) [Username]
                                                FROM [wis].[dbo].[USUARIOS] a
                                                     inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                                     inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                                WHERE trim(USERCODE) = trim('${username}') and trim(UserClave) = trim('${password}') 
                                                  and UserActivo = 'S'`;

                            request2.query(queryText, (err, recordset) => {

                                if (err) next(err);
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


router.get('/users/:name', function (req, res, next) {

     console.log('Call to api/users ');

     const pool = new sql.ConnectionPool(config, err => {

        if (err) next(err);

        var name = req.params.name;
    
        // create Request object
        var request = pool.request();
    
        // query to the database and get the records
        request.query(`select a.[UserNombre] from [wis].[dbo].[USUARIOS] a where a.[name] like ${name}`, (err, recordset) => {
    
            if (err) next(err)
    
            // send records as a response
           res.send(recordset); 
        });
    });

    pool.on('error', err => {
        res.send({error: err});
    });
 });

 

router.get('/homework/:gradeId.:sectionId', function (req, res, next) {

    console.log(`Call to api/homework/${req.params.gradeId}.${req.params.sectionId}`);

    const pool = new sql.ConnectionPool(config, err => {

       if (err) next(err);
  
       // create Request object
       var request = pool.request();
   
       var queryText = `SELECT trim(b.ClaDescrip) as [Subject]\
                        ,trim(c.GraDescripcion) as [Grade]\
                        ,trim(a.[TrabClassMatriculaDescrip]) as [Description]\
                        ,a.[TrabClassmatriculaPeso] as [Value]\
                        ,a.[TrabClassMatriculaFechEntre] as [Date]\
                        ,abs(DATEDIFF(dd, GETDATE(), a.[TrabClassMatriculaFechEntre])) [RemainTime]\
                            FROM [dbo].[TRABAJOSCLASESMATRICULADASLEVE] a\
                            inner join [dbo].CLASES b\
                                    on a.ClaCodigo = b.ClaCodigo\
                            inner join [dbo].GRADOS c\
                                    on c.GraCodigo = a.GraCodigo \
                    WHERE a.GraCodigo = ${req.params.gradeId} \
                        and a.SeccCodigo = ${req.params.sectionId} \
                        and a.TrabClassMatriculaFechMax >= GETDATE()\
                        and b.ClaTipo in ('NO','MD')
                        and b.ClaConPerso = 'N'
                    order by a.[TrabClassMatriculaFechEntre] desc`;

       //console.log(queryText);
       // query to the database and get the records
       request.query(queryText, (err, recordset) => {
   
           if (err) next(err)
   
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