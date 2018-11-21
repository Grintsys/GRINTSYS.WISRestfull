module.exports = (app, sql, config) => {
    app.get('/homework/:gradeId.:sectionId', function (req, res, next) {

        console.log(`Call to api/homework/${req.params.gradeId}.${req.params.sectionId}`);

        const pool = new sql.ConnectionPool(config, err => {

        if (err) next(err);
    
        // create Request object
        var request = pool.request();
    
        var queryText = `SELECT ltrim(rtrim(b.ClaDescrip)) as [Subject]\
                            ,ltrim(rtrim(c.GraDescripcion)) as [Grade]\
                            ,ltrim(rtrim(a.[TrabClassMatriculaDescrip])) as [Description]\
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
}