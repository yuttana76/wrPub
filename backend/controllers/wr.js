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
    FROM [MIT_Account_Profile]
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



exports.getAccountByCustID = (req, res, next) => {

  var fncName = 'getAccountByCustID';
  var custCode = req.params.cusCode;

  logger.info( `API /account - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
      SELECT Account_No from MIT_Account_Info_ext
      WHERE  STATUS = 'A'
      AND USERID ='${custCode}'
      ORDER BY Account_No
  `;

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
    console.log("EROR>>"+err);
  })
}


exports.getSummaryByCustID = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN

DECLARE @CustID VARCHAR(20) ='${custCode}';
DECLARE @DataDate date;

SELECT TOP 1  @DataDate = DataDate   FROM [IT_CustPortValueEndDay]
WHERE CustID= @CustID
  ORDER BY DataDate;

SELECT [CustID]
      ,c.Amc_Code
      ,c.Amc_Name
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
      ,[Proportion]
      ,DataDate
  FROM [IT_CustPortValueEndDay] a
  LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
  LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
  WHERE  Status ='A'
  AND CustID= @CustID
  AND DataDate = @DataDate

END
  `;

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
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){
    res.status(422).json({
      code: 'E001',
      message: `(fromDate ,fromDate )Fields is required field`
    });
  }

  logger.info( `API /dividend - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
    BEGIN
    DECLARE @CustID VARCHAR(20) = '${custCode}';
    SELECT x.Account_No
    ,x.Amc_id
    ,x.Holder_id
    ,b.Fund_Code
    ,b.FGroup_Code
    ,a.XD_Date
    ,a.DivPerUnit,a.Unit
    ,a.DivPerUnit * a.Unit AS VAL
    ,(a.DivPerUnit * a.Unit) - a.Tax_Amount AS NET_VAL
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN '${fromDate}' AND '${toDate}'
    ORDER BY x.Account_No,b.Fund_Code, XD_DATE
    END
  `;

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
  var fromDate = req.query.fromDate;
  var toDate = req.query.toDate;

  if (fromDate =='' || toDate ==''){
    res.status(422).json({
      code: 'E001',
      message: `(fromDate ,fromDate )Fields is required field`
    });
  }

  logger.info( `API /onSell - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) = '${custCode}';
  SELECT b.Fund_Code,b.FGroup_Code
  ,a.TranType_Code, a.ExecuteDate
  ,a.Amount_Baht,a.Amount_Unit,a.Nav_Price,a.RGL
      FROM [MFTS_Transaction] a
      LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN '${fromDate}' AND '${toDate}'
    order by a.ExecuteDate ;
    END`;

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
  var fromDate = req.query.fromDate;
  var toDate = req.query.toDate;

  if (fromDate =='' || toDate ==''){
    res.status(422).json({
      code: 'E001',
      message: `(fromDate ,fromDate )Fields is required field`
    });
  }

  logger.info( `API /transaction - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
            BEGIN
            DECLARE @CustID VARCHAR(20) = '${custCode}';
            SELECT
            b.Fund_Code
            , b.FGroup_Code
            , a.TranType_Code
            , a.Tran_Date
            , a.ExecuteDate
            , a.Amount_Baht, a.Amount_Unit, a.Nav_Price, a.Avg_Cost, a.RGL
            FROM [MFTS_Transaction] a
            LEFT JOIN [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
          , [MFTS_Account] x
            WHERE a.Ref_No=x.Ref_No
            AND x.Account_No= @CustID
            AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'
            ORDER BY a.Tran_Date;

          END `;

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
//*********************** V.2 */

exports.getSummaryGroupByFundType = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN

  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @DataDate date;

  --Find the max date
  SELECT TOP 1  @DataDate = DataDate   FROM [WR_MFTS].[dbo].[IT_CustPortValueEndDay]
  WHERE CustID= @CustID
    ORDER BY DataDate;

  SELECT a.* , a.TOTAL_COST-a.AVG_COST AS UN_GL,((a.TOTAL_COST-a.AVG_COST)/a.AVG_COST)*100 AS UN_GL_P
  FROM (
  SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate = @DataDate
  GROUP BY b.FGroup_Code
  ) a

  END
  `;

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



exports.getSummaryGainLoss = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @firstDate date;
  DECLARE @1month date;
  DECLARE @3month date;
  DECLARE @6month date;
  DECLARE @1year date;

  -- First day
SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)
select @1month = DateAdd(month,1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @3month = DateAdd(month,3, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @6month= DateAdd(month,6, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @1year = DateAdd(year,-1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )

-- select @firstDate,@1month,@3month,@6month,@1year
SELECT *
FROM
  (SELECT SUM(a.RGL) M1
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @1month) M1,

  (SELECT SUM(a.RGL) M3
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @3month) M3,

  (SELECT SUM(a.RGL) AS M6
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @6month) M6,

--      -- 1 Year
  (SELECT SUM(a.RGL) AS YR1
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @1year AND GETDATE()) Y1,

--      -- BEGIN Year
  (SELECT SUM(a.RGL) AS BYear
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND GETDATE()) BYear
END;
  `;

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

exports.getSummaryDividend = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @firstDate date;
  DECLARE @1month date;
  DECLARE @3month date;
  DECLARE @6month date;
  DECLARE @1year date;

  -- First day
SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)
select @1month = DateAdd(month,1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @3month = DateAdd(month,3, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @6month= DateAdd(month,6, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @1year = DateAdd(year,-1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )

-- select @firstDate,@1month,@3month,@6month,@1year
SELECT *
FROM
 (SELECT SUM(a.DivPerUnit * a.Unit) AS DIV_M1
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @firstDate AND @1month) M1,

 (SELECT SUM(a.DivPerUnit * a.Unit) AS DIV_M3
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @firstDate AND @3month) M3,

 (SELECT SUM(a.DivPerUnit * a.Unit) AS DIV_M6
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @firstDate AND @6month) M6,

-- --      -- 1 Year
 (SELECT SUM(a.DivPerUnit * a.Unit) AS DIV_YR1
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @1year AND GETDATE()) Y1,

-- --      -- BEGIN Year
 (SELECT SUM(a.DivPerUnit * a.Unit) AS DIV_BYear
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @firstDate AND GETDATE()) BYear

END;
  `;

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


exports.getSummaryUNGainLoss = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @firstDate date;
  DECLARE @1month date;
  DECLARE @3month date;
  DECLARE @6month date;
  DECLARE @1year date;

  -- First day
SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)
select @1month = DateAdd(month,1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @3month = DateAdd(month,3, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @6month= DateAdd(month,6, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )
select @1year = DateAdd(year,-1, DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0) )

SELECT *
FROM
  (SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_M1
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate BETWEEN @firstDate AND @1month
  GROUP BY b.FGroup_Code
  ) a ) aa,

 (SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_M3
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate BETWEEN @firstDate AND @3month
  GROUP BY b.FGroup_Code
  ) a ) bb,

(SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_M6
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate BETWEEN @firstDate AND @6month
  GROUP BY b.FGroup_Code
  ) a ) cc,

-- --      -- 1 Year
(SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_YR1
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate BETWEEN @1year AND GETDATE()
  GROUP BY b.FGroup_Code
  ) a ) dd,

  -- --      -- BEGIN Year
  (SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_BYear
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate BETWEEN @firstDate AND GETDATE()
  GROUP BY b.FGroup_Code
  ) a ) ee

END;
  `;

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
