module.exports = (app, sql, config) => {
    app.get('/student/:usercode', function(req, res, next){
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
            if(err) next(err);
    
            if(req.params.username){
                var username = req.params.username;
                console.log('Username: '+username);
    
                var request = pool.request();
                
                var queryText = ` SELECT distinct c.AluCodigo as StudentCode
                            ,rtrim(ltrim(e.UserNombre)) + ' ' + ltrim(rtrim(e.UserApellido)) [Name]
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
    
    app.get('/student/:estudentcode/data', function(req, res, next){
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
}