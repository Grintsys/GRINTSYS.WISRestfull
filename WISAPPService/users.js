module.exports = (app, sql, config) => {
    app.post('/users/login', function(req, res, next){

        console.log('Call to api/login ');
    
        var username = req.body.username;
        var password = req.body.password;
    
        if(!username || !password){
            res.status(403).send({ sucess: false, message: 'missing parameters'});
        }
    
        const pool = new sql.ConnectionPool(config, err => {
    
            if (err) return next(err);
    
            console.log("U: "+username+" P: "+password);
    
            // create Request object
            var request = pool.request();
                    
            var queryText = `select distinct ltrim(rtrim(a.UserCode)) Username, b.AluCodigo StudentCode
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                      WHERE ltrim(rtrim(UserLogin)) = ltrim(rtrim('${username}')) and ltrim(rtrim(UserClave)) = ltrim(rtrim('${password}'))`;
                         
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
    
                    var queryText = `SELECT distinct c.AluCodigo StudentCode, ltrim(rtrim(a.UserCode)) [Username]
                                       FROM [wis].[dbo].[USUARIOS] a
                                            inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                            inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                      WHERE ltrim(rtrim(USERCODE)) = ltrim(rtrim('${username}')) and ltrim(rtrim(UserClave)) = ltrim(rtrim('${password}')) 
                                        and UserActivo = 'S'`;
    
                            request2.query(queryText, (err, recordset) => {
    
                                if (err) return next(err);  
                                // send records as a response
    
                                if(recordset.recordset.length > 0)
                                {
                                    console.log("Success Login for familiy "+username);
        
                                    var result = {
                                        success: true, 
                                        message: 'Success Login for familiy',
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
            });
    
        pool.on('error', err => {
            res.send({error: err, success:false});
        });
    })
    
    app.get('/users/login2/:username.:password', function(req, res, next){
    
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
                    
                    var queryText = `select distinct rtrim(a.UserCode) Username, b.AluCodigo StudentCode
                                       from dbo.USUARIOS a
                                            inner join dbo.USUARIOSALUMNOS b on a.UserCode = b.UserCode
                                     WHERE rtrim(UserLogin) = rtrim(ltrim('${username}')) and rtrim(ltrim(UserClave)) = ltrim(rtrim('${password}'))
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
    
                            var queryText = `SELECT distinct c.AluCodigo StudentCode, rtrim(a.UserNombre) [Username]
                                                FROM [wis].[dbo].[USUARIOS] a
                                                     inner join wis.dbo.FAMILIAS b on a.UserCode = b.FamUsuario 
                                                     inner join wis.dbo.FAMILIASLEVEL11 c on c.FamCod = b.FamCod
                                                WHERE ltrim(rtrim(USERCODE)) = ltrim(rtrim('${username}')) and ltrim(rtrim(UserClave)) = ltrim(rtrim('${password}')) 
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
    
    
    app.get('/users/logout', function(req, res, next) {
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
    
    
    app.get('/users/:name', function (req, res, next) {
    
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
    
}