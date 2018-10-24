// var Promise = require('bluebird');

const dbConfig = require("./config");
// var sql = require("mssql");
var config = dbConfig.dbParameters;

var logger = require('../config/winston');


exports.getWrInfo = (req, res, next) => {
  res.status(200).json({
    message: "Welcome Wealth API"
  });
}


exports.getCustomerInfo = (req, res, next) => {

    var fncName = 'getCustomerInfo';
    var custCode = req.params.cusCode;

    logger.info( `API /custInfo - ${req.originalUrl} - ${req.ip} `);

    var queryStr = `select
    [Cust_Code]
      ,[Title_Name_T]
      ,[First_Name_T]
      ,[Last_Name_T]
      ,[Title_Name_E]
      ,[First_Name_E]
      ,[Last_Name_E]
    FROM [MFTS].[dbo].[MIT_Account_Profile]
    WHERE Cust_Code='${custCode}'`;

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



exports.getSummaryByCustID = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;
  var dueDate = req.body.dueDate;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -dueDate:${dueDate}`);

  var queryStr = ` SELECT     [CustID]
      ,[AMCID]
      ,c.Amc_Code
      ,c.Amc_Name
      ,[HolderID]
      ,[FundID]
      ,b.Fund_Code
      ,b.FGroup_Code
      ,[BalanceUnit]
      ,[AvgCostUnit]
      ,[AvgCost]
      ,[MarketPriceDate]
      ,[MarketPrice]
      ,[MarketValue]
      ,[GainLoss]
      ,[ReturnPC]
      ,[AmtDays]
      ,[Proportion]
  FROM [WR_MFTS].[dbo].[IT_CustPortValueEndDay] a
  LEFT JOIN   [WR_MFTS].[dbo].[MFTS_Fund] b ON a.FundID = b.Fund_Id
  LEFT JOIN  [WR_MFTS].[dbo].[MFTS_Amc] c ON a.AMCID = c.Amc_Id

  WHERE  Status ='A'
  AND CustID='${custCode}'
  AND DataDate = '${dueDate}' `;

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


exports.getDividendByCustID = (req, res, next) => {

  var fncName = 'getDividendByCustID';
  var custCode = req.params.cusCode;
  var fromDate = req.body.fromDate;
  var toDate = req.body.toDate;

  logger.info( `API /dividend - ${req.originalUrl} - ${req.ip} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = ` SELECT b.Fund_Code
  ,b.FGroup_Code
  ,a.XD_Date
  ,a.DivPerUnit,a.Unit
  ,a.DivPerUnit * a.Unit AS VAL
  ,(a.DivPerUnit * a.Unit) - a.Tax_Amount AS NET_VAL
  FROM [WR_MFTS].[dbo].[MFTS_Dividend] a
  LEFT JOIN   [WR_MFTS].[dbo].[MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
  , [WR_MFTS].[dbo].[MFTS_Account] x
  WHERE a.Ref_No=x.Ref_No
  AND x.Account_No='${custCode}'
  AND XD_DATE BETWEEN '${fromDate}' AND '${toDate}'
  ORDER BY XD_DATE `;

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

exports.getFromSell = (req, res, next) => {

  var fncName = 'getFromSell';
  var custCode = req.params.cusCode;
  var fromDate = req.body.fromDate;
  var toDate = req.body.toDate;

  logger.info( `API /onSell - ${req.originalUrl} - ${req.ip} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = ` SELECT a.ExecuteDate
  ,a.Amount_Baht,a.Amount_Unit,a.Nav_Price,a.RGL
      FROM [WR_MFTS].[dbo].[MFTS_Transaction] a
    , [WR_MFTS].[dbo].[MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No='${custCode}'
    AND ExecuteDate BETWEEN '${fromDate}' AND '${toDate}'
    order by a.ExecuteDate `;

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



exports.getTransaction = (req, res, next) => {

  var fncName = 'getTransaction';
  var custCode = req.params.cusCode;
  var fromDate = req.body.fromDate;
  var toDate = req.body.toDate;

  logger.info( `API /transaction - ${req.originalUrl} - ${req.ip} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = ` SELECT
  b.Fund_Code
  , b.FGroup_Code
  , a.TranType_Code
  , a.Tran_Date
  , a.ExecuteDate
  , a.Amount_Baht, a.Amount_Unit, a.Nav_Price, a.RGL
FROM [WR_MFTS].[dbo].[MFTS_Transaction] a
  LEFT JOIN [WR_MFTS].[dbo].[MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
, [WR_MFTS].[dbo].[MFTS_Account] x
where a.Ref_No=x.Ref_No
  AND x.Account_No='${custCode}'
  AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'
order by a.Tran_Date `;

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
