module.exports = (app, sql, config) => {
    //http://localhost:8090/api/grades/6.1.2015192.1
    app.get('/grades/:gradeId.:sectionId.:studentId.:partial', function(req, res, next){
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

    app.get('/grades/average/:gradeId.:sectionId.:studentId.:partial', function(req, res, next){
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
}