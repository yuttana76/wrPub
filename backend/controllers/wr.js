// var Promise = require('bluebird');

const dbConfig = require('../config/db-config');

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

  var fncName = 'getSummaryByCustID';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryByCust - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN

DECLARE @CustID VARCHAR(20) ='${custCode}';
DECLARE @DataDate date;

SELECT TOP 1  @DataDate = DataDate
FROM [IT_CustPortValueEndDay]
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

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
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
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
  }

  logger.info( `API /onSell - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr =  `BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';

DECLARE @Amc_Name   [varchar](200);
DECLARE @FGroup_Code   [varchar](15);
DECLARE @Fund_Id   int;
DECLARE @Seq_No   int;
DECLARE @Fund_Code [varchar](30);
DECLARE @TranType_Code [varchar](2);
DECLARE @Ref_NO   [varchar](15);
DECLARE @ExecuteDate  [datetime];
DECLARE @Amount_Baht   [decimal](18, 2)=0;
DECLARE @SUM_Amount_Baht   [decimal](18, 2)=0;
DECLARE @Amount_Unit   [decimal](18, 4)=0;
DECLARE @Nav_Price [numeric](18, 4);
DECLARE @Cost_Amount_Baht   [decimal](18, 2)=0;
DECLARE @SUM_Cost_Amount_Baht   [decimal](30, 2)=0;
DECLARE @RGL   [decimal](20, 6)=0 ;
DECLARE @SUM_RGL   [decimal](20, 6);
DECLARE @Avg_Cost [decimal](18, 2)=0;

declare @temp table(
   Amc_Name[varchar](200)
   ,FGroup_Code [varchar](15)
   ,Fund_Code [varchar](30)
   ,TranType_Code [varchar](2)
   ,Ref_No [varchar](12)
   ,ExecuteDate [datetime]
   ,Amount_Baht [numeric](18, 2)
   ,Amount_Unit [numeric](18, 4)
   ,Nav_Price [numeric](18, 4)
   ,Avg_Cost [numeric](18, 4)
   ,Cost_Amount_Baht [numeric](18, 2)
   ,RGL [decimal](20, 6)
   ,RGL_P [decimal](20, 6)
)

DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
SELECT c.Amc_Name,b.FGroup_Code,b.Fund_Code,a.TranType_Code,a.Fund_Id,a.Seq_No,a.Ref_No,a.ExecuteDate
,a.Amount_Baht
,a.Amount_Unit
,a.Nav_Price
,a.Avg_Cost
, a.Amount_Unit * a.Avg_Cost
,a.RGL
    FROM [MFTS_Transaction] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    LEFT JOIN   MFTS_Amc c ON b.Amc_Id=c.Amc_Id
  , [MFTS_Account] x
  where a.Ref_No=x.Ref_No
  AND a.Status_Id=7
  AND TranType_Code IN ('S','SO','TO')
  AND x.Account_No= @CustID
  AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'

  OPEN MFTS_Transaction_cursor
    FETCH NEXT FROM MFTS_Transaction_cursor INTO @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL

          WHILE @@FETCH_STATUS = 0
          BEGIN

              IF ISNULL(@Cost_Amount_Baht,0) = 0
              BEGIN
                  select TOP 1 @Avg_Cost= ISNULL(Avg_Cost,0)
                  from MFTS_Transaction
                  where  Ref_NO = @Ref_NO
                  AND Fund_Id = @Fund_Id
                  AND Seq_No < @Seq_No
                  AND Status_Id=7
                  AND TranType_Code IN ('B','SI','TI')
                  ORDER BY Seq_No desc

                  SET @Cost_Amount_Baht  =  ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0)
              END

              IF ISNULL(@RGL,0) = 0
              BEGIN
              SET @RGL = @Amount_Baht - @Cost_Amount_Baht;
              END

              INSERT INTO @temp
                 SELECT @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,(@RGL/@Cost_Amount_Baht)*100

                 FETCH NEXT FROM MFTS_Transaction_cursor INTO @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL

          END

      CLOSE MFTS_Transaction_cursor
      DEALLOCATE MFTS_Transaction_cursor

  -- OUTPUT
  SELECT * FROM @temp

END`

// console.log('QUERY>>' + queryStr);

  // var queryStr = `
  // BEGIN
  // DECLARE @CustID VARCHAR(20) = '${custCode}';
  // SELECT b.Fund_Code,b.FGroup_Code
  // ,a.TranType_Code, a.ExecuteDate
  // ,a.Amount_Baht,a.Amount_Unit,a.Nav_Price,a.RGL
  //     FROM [MFTS_Transaction] a
  //     LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
  //   , [MFTS_Account] x
  //   where a.Ref_No=x.Ref_No
  //   AND TranType_Code IN ('S','SO')
  //   AND x.Account_No= @CustID
  //   AND ExecuteDate BETWEEN '${fromDate}' AND '${toDate}'
  //   order by a.ExecuteDate ;
  //   END`;

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
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
  }

  logger.info( `API /transaction - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
            BEGIN
            DECLARE @CustID VARCHAR(20) = '${custCode}';

            DECLARE @Amc_Name   [varchar](200);
            DECLARE @FGroup_Code   [varchar](15);
            DECLARE @Fund_Id   int;
            DECLARE @Seq_No   int;
            DECLARE @Fund_Code [varchar](30);
            DECLARE @TranType_Code [varchar](2);
            DECLARE @Ref_NO   [varchar](15);
            DECLARE @TranDate  [datetime];
            DECLARE @Amount_Baht   [decimal](18, 2)=0;
            DECLARE @SUM_Amount_Baht   [decimal](18, 2)=0;
            DECLARE @Amount_Unit   [decimal](18, 4)=0;
            DECLARE @Nav_Price [numeric](18, 4);
            DECLARE @Cost_Amount_Baht   [decimal](18, 2)=0;
            DECLARE @SUM_Cost_Amount_Baht   [decimal](30, 2)=0;
            DECLARE @RGL   [decimal](20, 6)=0 ;
            DECLARE @RGL_P   [decimal](20, 6)=0 ;
            DECLARE @SUM_RGL   [decimal](20, 6);
            DECLARE @Avg_Cost [decimal](18, 2)=0;

            declare @temp table(
              Amc_Name[varchar](200)
              ,FGroup_Code [varchar](15)
              ,Fund_Code [varchar](30)
              ,TranType_Code [varchar](2)
              ,Ref_No [varchar](12)
              ,TranDate [datetime]
              ,Amount_Baht [numeric](18, 2)
              ,Amount_Unit [numeric](18, 4)
              ,Nav_Price [numeric](18, 4)
              ,Avg_Cost [numeric](18, 4)
              ,Cost_Amount_Baht [numeric](18, 2)
              ,RGL [decimal](20, 6)
              ,RGL_P [decimal](20, 6)
            )

            DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
            SELECT c.Amc_Name,b.FGroup_Code,b.Fund_Code,a.TranType_Code,a.Fund_Id,a.Seq_No,a.Ref_No,a.Tran_Date
            ,a.Amount_Baht
            ,a.Amount_Unit
            ,a.Nav_Price
            ,a.Avg_Cost
            , a.Amount_Unit * a.Avg_Cost
            ,a.RGL
                FROM [MFTS_Transaction] a
                LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
                LEFT JOIN   MFTS_Amc c ON b.Amc_Id=c.Amc_Id
              , [MFTS_Account] x
              where a.Ref_No=x.Ref_No
              --AND a.Status_Id=7
              AND TranType_Code IN ('S','SO','TO','B','SI','TI')
              AND x.Account_No= @CustID
              AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'

              OPEN MFTS_Transaction_cursor
                FETCH NEXT FROM MFTS_Transaction_cursor INTO @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL

                      WHILE @@FETCH_STATUS = 0
                      BEGIN

                          IF ISNULL(@Cost_Amount_Baht,0) = 0
                          BEGIN
                              select TOP 1 @Avg_Cost= ISNULL(Avg_Cost,0)
                              from MFTS_Transaction
                              where  Ref_NO = @Ref_NO
                              AND Fund_Id = @Fund_Id
                              AND Seq_No < @Seq_No
                              AND Status_Id=7
                              AND TranType_Code IN ('B','SI','TI')
                              ORDER BY Seq_No desc

                              SET @Cost_Amount_Baht  =  ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0)
                          END

                          IF ISNULL(@RGL,0) = 0
                          BEGIN
                          SET @RGL = @Amount_Baht - @Cost_Amount_Baht;
                          END

                          SET @RGL_P =0;
                          IF @RGL <> 0 AND @Cost_Amount_Baht != 0
                          BEGIN
                              SET @RGL_P =  @RGL/@Cost_Amount_Baht * 100
                          END


                          INSERT INTO @temp
                            SELECT @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@RGL_P

                            FETCH NEXT FROM MFTS_Transaction_cursor INTO @Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL

                      END

                  CLOSE MFTS_Transaction_cursor
                  DEALLOCATE MFTS_Transaction_cursor

              -- OUTPUT
              SELECT * FROM @temp

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

  logger.info( `API /summaryGroupByFundType - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

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

  logger.info( `API /summaryGainLossByM - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

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
  (SELECT ISNULL(SUM(a.RGL),0) M1
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @1month) M1,

  (SELECT ISNULL(SUM(a.RGL),0) M3
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @3month) M3,

  (SELECT ISNULL(SUM(a.RGL),0) AS M6
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND @6month) M6,

--      -- 1 Year
  (SELECT ISNULL(SUM(a.RGL),0) AS YR1
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @1year AND GETDATE()) Y1,

--      -- BEGIN Year
  (SELECT ISNULL(SUM(a.RGL),0) AS BYear
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
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

exports.getSummaryDividendByMonth = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryDividendByM - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

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

  logger.info( `API /summaryUNGainLossByM - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

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


exports.getSummaryOnSell = (req, res, next) => {

  var fncName = 'getSummaryOnSell';
  var custCode = req.params.cusCode;
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
  }

  logger.info( `API /summaryOnSell - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';

-- Execute whole year
  DECLARE @firstDate date;
  SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)

  DECLARE @FGroup_Code   [varchar](15);
  DECLARE @Fund_Id   int;
  DECLARE @Seq_No   int;
  DECLARE @Ref_NO   [varchar](15);
  DECLARE @Amount_Baht   [decimal](18, 2)=0;
  DECLARE @SUM_Amount_Baht   [decimal](18, 2)=0;
  DECLARE @Amount_Unit   [decimal](18, 4)=0;
  DECLARE @Cost_Amount_Baht   [decimal](18, 2)=0;
  DECLARE @SUM_Cost_Amount_Baht   [decimal](30, 2)=0;
  DECLARE @RGL   [decimal](20, 6)=0 ;
  DECLARE @SUM_RGL   [decimal](20, 6);

  DECLARE @Avg_Cost [decimal](18, 2)=0;

  DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
  SELECT b.FGroup_Code  ,a.Fund_Id,a.Seq_No,a.Ref_No
  ,a.Amount_Baht
  ,a.Amount_Unit
  , a.Amount_Unit * a.Avg_Cost
  ,a.RGL
      FROM [MFTS_Transaction] a
      LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    --AND ExecuteDate BETWEEN @firstDate AND GETDATE()
    AND ExecuteDate BETWEEN '${fromDate}' AND '${toDate}'

    OPEN MFTS_Transaction_cursor
        FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL

            WHILE @@FETCH_STATUS = 0
            BEGIN

                IF ISNULL(@Cost_Amount_Baht,0) = 0
                BEGIN
                    select TOP 1 @Avg_Cost= ISNULL(Avg_Cost,0)
                    from MFTS_Transaction
                    where  Ref_NO = @Ref_NO
                    AND Fund_Id = @Fund_Id
                    AND Seq_No < @Seq_No
                    AND Status_Id=7
                    AND TranType_Code IN ('B','SI','TI')
                    ORDER BY Seq_No desc

                    SET @Cost_Amount_Baht  =  ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0)
                END

                -- SUM 1
                SET  @SUM_Amount_Baht  += @Amount_Baht;

                -- SUM 2
                SET @SUM_Cost_Amount_Baht += ISNULL(@Cost_Amount_Baht,0);

                -- SUM 3
                -- SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ISNULL(@RGL,0)
                SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ( ISNULL(@Amount_Baht,0) - ISNULL(@Cost_Amount_Baht,0))

                FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL
            END

        CLOSE MFTS_Transaction_cursor
        DEALLOCATE MFTS_Transaction_cursor

    -- OUTPUT
    SELECT  @SUM_Amount_Baht AS SUM_Amount_Baht, @SUM_Cost_Amount_Baht AS SUM_Cost_Amount_Baht, @SUM_RGL  AS SUM_RGL
    , (@SUM_RGL/@SUM_Cost_Amount_Baht)*100 SUM_RGL_P

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


exports.getSummaryDividend = (req, res, next) => {

  var fncName = 'getSummaryDividend';
  var custCode = req.params.cusCode;
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
  }

  logger.info( `API /summaryDividend - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';

  SELECT SUM((a.DivPerUnit * a.Unit)) AS DIV_AMOUNT,SUM(a.Tax_Amount) DIV_TAX,SUM((a.DivPerUnit * a.Unit) - a.Tax_Amount) DIV_NET_AMOUNT
  FROM [MFTS_Dividend] a
  LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
  , [MFTS_Account] x
  WHERE a.Ref_No=x.Ref_No
  AND x.Account_No= @CustID
  AND XD_DATE BETWEEN '${fromDate}' AND '${toDate}'

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

exports.getSummaryTransaction = (req, res, next) => {

  var fncName = 'getSummaryDividend';
  var custCode = req.params.cusCode;
  var fromDate = req.query.fromDate || '';
  var toDate = req.query.toDate || '';

  if (fromDate =='' || toDate ==''){

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    //  year-mm-dd
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;

    // res.status(422).json({
    //   code: 'E001',
    //   message: `(fromDate ,fromDate )Fields is required field`
    // });
  }

  logger.info( `API /summaryTransaction - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @FGroup_Code   [varchar](15);
  DECLARE @Fund_Id   int;
  DECLARE @Seq_No   int;
  DECLARE @Ref_NO   [varchar](15);
  DECLARE @Amount_Baht   [decimal](18, 2)=0;
  DECLARE @SUM_Amount_Baht   [decimal](18, 2)=0;
  DECLARE @Amount_Unit   [decimal](18, 4)=0;
  DECLARE @Cost_Amount_Baht   [decimal](18, 2)=0;
  DECLARE @SUM_Cost_Amount_Baht   [decimal](30, 2)=0;
  DECLARE @RGL   [decimal](20, 6)=0 ;
  DECLARE @SUM_RGL   [decimal](20, 6);
  DECLARE @SUM_BUY_Amount_Baht   [decimal](18, 2)=0;
  DECLARE @Avg_Cost [decimal](18, 2)=0;

  DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
  SELECT b.FGroup_Code  ,a.Fund_Id,a.Seq_No,a.Ref_No
  ,a.Amount_Baht
  ,a.Amount_Unit
  , a.Amount_Unit * a.Avg_Cost
  ,a.RGL
      FROM [MFTS_Transaction] a
      LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
--  AND a.TranType_Code IN ('S','SO','TO','B','SI','TI')
    AND a.TranType_Code IN ('S','SO','TO')
            AND a.Status_Id=7
    AND x.Account_No= @CustID
    AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'

    OPEN MFTS_Transaction_cursor
        FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL

            WHILE @@FETCH_STATUS = 0
            BEGIN

                IF ISNULL(@Cost_Amount_Baht,0) = 0
                BEGIN
                    select TOP 1 @Avg_Cost= ISNULL(Avg_Cost,0)
                    from MFTS_Transaction
                    where  Ref_NO = @Ref_NO
                    AND Fund_Id = @Fund_Id
                    AND Seq_No < @Seq_No
                    AND Status_Id=7
                    AND TranType_Code IN ('B','SI','TI')
                    ORDER BY Seq_No desc

                    SET @Cost_Amount_Baht  =  ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0)
                END

                -- SUM 1
                SET  @SUM_Amount_Baht  += @Amount_Baht;

                -- SUM 2
                SET @SUM_Cost_Amount_Baht += ISNULL(@Cost_Amount_Baht,0);

                -- SUM 3
                -- SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ISNULL(@RGL,0)
                SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ( ISNULL(@Amount_Baht,0) - ISNULL(@Cost_Amount_Baht,0))

                FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL
            END

        CLOSE MFTS_Transaction_cursor
        DEALLOCATE MFTS_Transaction_cursor

    -- Find SUM BUY
        SELECT    @SUM_BUY_Amount_Baht = SUM(a.Amount_Baht)
            FROM [MFTS_Transaction] a
            LEFT JOIN [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
          , [MFTS_Account] x
            WHERE a.Ref_No=x.Ref_No
            AND x.Account_No= @CustID
            AND a.TranType_Code IN ('B','SI','TI')
            AND a.Status_Id=7
            AND Tran_Date BETWEEN '${fromDate}' AND '${toDate}'

    -- OUTPUT
    SELECT  @SUM_BUY_Amount_Baht AS  SUM_BUY_Amount_Baht
    ,@SUM_Amount_Baht AS SUM_SELL_Amount_Baht
    ,@SUM_Cost_Amount_Baht AS SUM_SELL_Cost_Amount_Baht
    ,@SUM_RGL  AS SUM_SELL_RGL
    ,(@SUM_RGL/@SUM_Cost_Amount_Baht)*100 SUM__SELL_RGL_P

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
