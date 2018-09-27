
const dbConfig = require('./config');

var config = dbConfig.dbParameters;

exports.getTambons = (req, res, next) => {

  var fncName = 'getProvinces';

  var queryStr = `select *
  FROM [MFTS].[dbo].[REF_Tambons]
  WHERE IsNull([Name_Thai], '') != ''
  ORDER BY [Amphur_ID],[Name_Thai]`;

  const sql = require('mssql')
  const pool1 = new sql.ConnectionPool(config, err => {
    pool1.request() // or: new sql.Request(pool1)
    .query(queryStr, (err, result) => {
        // ... error checks
        if(err){
          console.log( fncName +' Quey db. Was err !!!' + err);
          res.status(201).json({
            message: err,
          });
        }else {
          res.status(200).json({
            message: fncName + "Quey db. successfully!",
            result: result.recordset
          });
        }
    })
  })

  pool1.on('error', err => {
    // ... error handler
    console.log("EROR>>"+err);
  })
}