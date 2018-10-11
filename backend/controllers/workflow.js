// var Promise = require('bluebird');

const dbConfig = require("./config");
// var sql = require("mssql");
var config = dbConfig.dbParameters;


exports.getWorkFlow = (req, res, next) => {

  var fncName = 'getCustomer';
  var appRef = req.params.appRef;

  var queryStr = `select *
  FROM [MFTS].[dbo].[MIT_WorkFlowTrans]
  WHERE AppRef='${appRef}'`;

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


exports.updateWorkFlow = (req, res, next) => {

  var updateQuery = `
  UPDATE MIT_WorkFlowTrans
  SET WFStatus= '${req.body.WFStatus}'
  ,Comment='${req.body.Comment}'
  ,ActionDate=GETDATE()
  ,ActionBy='${req.body.ActionBy}'
where AppRef='${req.body.AppRef}'
AND wfRef =  '${req.body.wfRef}'
AND seqNo= ${req.body.SeqNo}
  `;

  const sql = require("mssql");
  const pool1 = new sql.ConnectionPool(config, err => {

     // Start Account Info Transaction 1
     var transaction = new sql.Transaction(pool1);
     transaction.begin(function(err) {
       var requestQuery = new sql.Request(transaction);

       requestQuery.query(updateQuery, function(err, recordset) {
         if (err) {
           console.log("Was error !!", err);
           transaction.rollback(err => {
              res.status(400).json({
                 message: 'Create Customer fail'
               });
           });
         } else {
           transaction.commit(err => {
             // console.log("Cmmited !");
              res.status(201).json({
               message: 'Customer create successfully',
               recordset:recordset

             });
           });
         }
       });
     });
     // End Account Info Transaction 1

  });

  pool1.on("error", err => {
    // ... error handler
    console.log("EROR>>" + err);
  });

};


exports.ExeWFAccountUpdate = (req, res, next) => {

  var o2x = require('object-to-xml');
  var fncName = "ExeWFAccountUpdate";
  var workFlowTransObj = JSON.parse(req.body.workFlowTrans);

  console.log("appRef>> ", req.params.appRef);
  console.log("workFlowTransObj>> ", JSON.stringify(workFlowTransObj));

  const sql = require("mssql");
  const pool1 = new sql.ConnectionPool(config, err => {
    pool1.request()
      .input('WorkFlowTransXML', sql.Xml,  o2x(workFlowTransObj))
      .execute('[dbo].[MIT_WorkFlowTrans_accountUpdate]', (err, result) => {

       console.log('err>>',JSON.stringify(err));

        if (err) {
          console.log(fncName + " Quey db. Was err !!!" + JSON.stringify(result));

          res.status(201).json({
            message: err
            // result: result.output
          });
        } else {
          console.log(fncName + " Result>>" + JSON.stringify(result));
          res.status(200).json({
            message: fncName + "Quey db. successfully!",
            result: result
          });
        }
      });
  });
  pool1.on("error", err => {
    // ... error handler
    console.log("EROR>>" + err);
  });
};
