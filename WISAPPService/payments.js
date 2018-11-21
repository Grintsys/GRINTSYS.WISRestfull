module.exports = (app, sql, config) => {
        //payments/6.1
    app.get('/payments/:gradeId.:cod', function(req, res, next){
        console.log('call to api/payments');
        const pool = new sql.ConnectionPool(config, err => {
            if (err) next(err);

            if(req.params.gradeId && req.params.cod){
                var grade = req.params.gradeId;
                var cod = req.params.cod;

                console.log('grade: '+grade + ' code: '+cod);

                var request = pool.request();

                var queryText = `select rtrim(ltrim(b.CoConcDescrip)) [Description],
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
}