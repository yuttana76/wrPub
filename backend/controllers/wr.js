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
      ,convert(varchar, b.Document_Date, 111) AS riskDate
      ,b.Score AS riskScore
      ,b.Risk_Level AS riskLevel
      ,b.Risk_Level_Desc AS riskDesc
    FROM [MIT_Account_Profile]
    LEFT JOIN  MFTS_Suit b ON b.Account_No = CUST_CODE AND b.Active_Flag='A'
    WHERE Cust_Code='${custCode}'
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
ORDER BY DataDate DESC;

SELECT [CustID]
      ,c.Amc_Code
      ,c.Amc_Name
      ,c.amc_name_e AS amcNameE
      ,b.Fund_Code
      ,b.FGroup_Code
      ,b.Thai_Name AS fundNameT
      ,b.Eng_Name AS fundNameE
      ,[BalanceUnit]
      ,[AvgCostUnit]
      ,[AvgCost]
      ,[MarketPriceDate] AS DataDate
      ,[MarketPrice]
      ,[MarketValue]
      ,[GainLoss]
      ,[ReturnPC]
      ,[Proportion]
      --,DataDate
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

  if (fromDate ==='' ){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    fromDate = `${year}-01-01`;
    console.log('*** Setting fromDate '+ fromDate);
  }

  if (toDate ===''){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    toDate = `${year}-12-31`;
    console.log('*** Setting toDate '+toDate);
  }


  logger.info( `API /dividend - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
    BEGIN
    DECLARE @CustID VARCHAR(20) = '${custCode}';
    SELECT x.Account_No
    ,c.Amc_Code AS Amc_Name
    ,c.amc_name_e AS amcNameE
    ,x.Holder_id
    ,b.Fund_Code
    ,b.FGroup_Code
    ,b.Thai_Name AS fundNameT
    ,b.Eng_Name AS fundNameE
    ,a.XD_Date
    ,a.Payment_Date
    ,a.DivPerUnit
    ,a.Unit
    ,a.DivPerUnit * a.Unit AS VAL
    ,a.Tax_Amount AS Tax_Amount
    ,(a.DivPerUnit * a.Unit) - a.Tax_Amount AS NET_VAL
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    LEFT JOIN   MFTS_Amc c ON b.Amc_Id=c.Amc_Id
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

  // if (fromDate =='' || toDate ==''){

  //   var currentTime = new Date()
  //   var year = currentTime.getFullYear()
  //   //  year-mm-dd
  //   fromDate = `${year}-01-01`;
  //   toDate = `${year}-12-31`;
  // }


  if (fromDate ==='' ){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    fromDate = `${year}-01-01`;
    // console.log('*** Setting fromDate '+ fromDate);
  }

  if (toDate ===''){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    toDate = `${year}-12-31`;
    // console.log('*** Setting toDate '+toDate);
  }


  logger.info( `API /onSell - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr =  `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';

  DECLARE @fromDate date ='${fromDate}';
  DECLARE @toDate date ='${toDate}';

DECLARE @amcNameE   [varchar](200);
DECLARE @fundNameT   [varchar](200);
DECLARE @fundNameE   [varchar](200);
DECLARE @Amc_Name   [varchar](200);
DECLARE @FGroup_Code   [varchar](15);
DECLARE @Fund_Id   int;
DECLARE @Seq_No   int;
DECLARE @Fund_Code [varchar](30);
DECLARE @TranType_Code [varchar](2);
DECLARE @Tran_Date [datetime];
DECLARE @Ref_NO   [varchar](15);
DECLARE @ExecuteDate  [datetime];
DECLARE @Amount_Baht   [decimal](18, 2)=0;
DECLARE @SUM_Amount_Baht   [decimal](18, 2)=0;
DECLARE @Amount_Unit   [decimal](18, 4)=0;
DECLARE @Nav_Price [numeric](18, 4);
DECLARE @Cost_Amount_Baht   [decimal](18)=0;
DECLARE @SUM_Cost_Amount_Baht   [decimal](30)=0;
DECLARE @RGL   [decimal](20, 6)=0 ;
DECLARE @SUM_RGL   [decimal](20, 6);
DECLARE @Avg_Cost [decimal](18, 4)=0;
DECLARE @Act_ExecDate Date;

declare @temp table(
  amcNameE [varchar](200)
  ,fundNameT [varchar](200)
  ,fundNameE [varchar](200)
 ,Amc_Name[varchar](200)
 ,FGroup_Code [varchar](15)
 ,Fund_Code [varchar](30)
 ,TranType_Code [varchar](2)
 ,Tran_Date [datetime]
 ,Ref_No [varchar](12)
 ,ExecuteDate [datetime]
 ,Amount_Baht [numeric](18, 2)
 ,Amount_Unit [numeric](18, 4)
 ,Nav_Price [numeric](18, 4)
 ,Avg_Cost [numeric](18, 4)
 ,Cost_Amount_Baht [numeric](18)
 ,RGL [decimal](20, 6)
 ,RGL_P [decimal](20, 2)
 ,Act_ExecDate Date
)

DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
SELECT
c.amc_name_e AS amcNameE
,b.Thai_Name AS fundNameT
,b.Eng_Name AS fundNameE
,c.Amc_CODE AS Amc_Name,b.FGroup_Code,b.Fund_Code,a.TranType_Code,a.Tran_Date,a.Fund_Id,a.Seq_No,a.Ref_No,a.ExecuteDate
,a.Amount_Baht
,a.Amount_Unit
,a.Nav_Price
,a.Avg_Cost
, a.Amount_Unit * a.Avg_Cost
,a.RGL
,a.Act_ExecDate
  FROM [MFTS_Transaction] a
  LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
  LEFT JOIN   MFTS_Amc c ON b.Amc_Id=c.Amc_Id
, [MFTS_Account] x
where a.Ref_No=x.Ref_No
AND a.Status_Id=7
AND TranType_Code IN ('S','SO','TO')
AND x.Account_No= @CustID
AND ExecuteDate BETWEEN @fromDate AND @toDate
ORDER BY ExecuteDate ASC

OPEN MFTS_Transaction_cursor
  FETCH NEXT FROM MFTS_Transaction_cursor INTO @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Tran_Date,@Fund_Id,@Seq_No,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@Act_ExecDate

        WHILE @@FETCH_STATUS = 0
        BEGIN

              select @Avg_Cost = AvgCostPerUnit from MIT_AverageCostPerUnit(@Ref_NO,@Fund_Id,@Act_ExecDate)
              SET @Cost_Amount_Baht  =  ROUND(@Amount_Unit * @Avg_Cost,2)

            IF ISNULL(@RGL,0) = 0
            BEGIN
            SET @RGL = @Amount_Baht - @Cost_Amount_Baht;
            END

            INSERT INTO @temp
               SELECT @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Tran_Date,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,(@RGL/@Cost_Amount_Baht)*100,@Act_ExecDate

               FETCH NEXT FROM MFTS_Transaction_cursor INTO @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Tran_Date,@Fund_Id,@Seq_No,@Ref_NO,@ExecuteDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@Act_ExecDate

        END

    CLOSE MFTS_Transaction_cursor
    DEALLOCATE MFTS_Transaction_cursor

    -- OUTPUT
    SELECT * FROM @temp

END
`

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


  if (fromDate ==='' ){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    fromDate = `${year}-01-01`;
    console.log('*** Setting fromDate '+ fromDate);
  }

  if (toDate ===''){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    toDate = `${year}-12-31`;
    console.log('*** Setting toDate '+toDate);
  }


  logger.info( `API /transaction - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
            BEGIN
            DECLARE @CustID VARCHAR(20) = '${custCode}';
            DECLARE @fromDate Date = '${fromDate}';
            DECLARE @toDate Date = '${toDate}';

            DECLARE @amcNameE   [varchar](200);
            DECLARE @fundNameT   [varchar](200);
            DECLARE @fundNameE   [varchar](200);

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
            DECLARE @Cost_Amount_Baht   [decimal](18)=0;
            DECLARE @SUM_Cost_Amount_Baht   [decimal](30, 2)=0;
            DECLARE @RGL   [decimal](20, 6)=0 ;
            DECLARE @RGL_P   [decimal](20, 6)=0 ;
            DECLARE @SUM_RGL   [decimal](20, 6);
            DECLARE @Avg_Cost [decimal](18, 4)=0;
            DECLARE @Act_ExecDate Date;

            declare @temp table(
              amcNameE [varchar](200)
              ,fundNameT [varchar](200)
              ,fundNameE [varchar](200)
              ,Amc_Name[varchar](200)
              ,FGroup_Code [varchar](15)
              ,Fund_Code [varchar](30)
              ,TranType_Code [varchar](2)
              ,Ref_No [varchar](12)
              ,TranDate [datetime]
              ,Amount_Baht [numeric](18, 2)
              ,Amount_Unit [numeric](18, 4)
              ,Nav_Price [numeric](18, 4)
              ,Avg_Cost [numeric](18, 4)
              ,Cost_Amount_Baht [numeric](18)
              ,RGL [decimal](20, 6)
              ,RGL_P [decimal](20, 2)
              ,Act_ExecDate Date
            )

            DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
            SELECT
            c.amc_name_e AS amcNameE
            ,b.Thai_Name AS fundNameT
            ,b.Eng_Name AS fundNameE
            ,c.Amc_CODE AS Amc_Name,b.FGroup_Code,b.Fund_Code,a.TranType_Code,a.Fund_Id,a.Seq_No,a.Ref_No, a.Act_ExecDate AS Tran_Date
            ,a.Amount_Baht
            ,a.Amount_Unit
            ,a.Nav_Price
            ,a.Avg_Cost
            , a.Amount_Unit * a.Avg_Cost
            ,a.RGL
            ,a.Act_ExecDate
            FROM [MFTS_Transaction] a
                LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
                LEFT JOIN   MFTS_Amc c ON b.Amc_Id=c.Amc_Id
              , [MFTS_Account] x
              where a.Ref_No=x.Ref_No
              AND a.Status_Id=7
              AND TranType_Code IN ('S','SO','TO','B','SI','TI')
              AND x.Account_No= @CustID
              AND Tran_Date BETWEEN @fromDate AND @toDate
              ORDER BY a.Act_ExecDate ASC

              OPEN MFTS_Transaction_cursor
                FETCH NEXT FROM MFTS_Transaction_cursor INTO @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@Act_ExecDate

                      WHILE @@FETCH_STATUS = 0
                      BEGIN


                          select @Avg_Cost = AvgCostPerUnit from MIT_AverageCostPerUnit(@Ref_NO,@Fund_Id,@Act_ExecDate)
                          SET @Cost_Amount_Baht  =  ROUND(ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0))


                          IF @TranType_Code NOT IN ('B','SI','TI')
                          BEGIN
                            IF ISNULL(@RGL,0) = 0
                            BEGIN
                            SET @RGL = @Amount_Baht - @Cost_Amount_Baht;
                            END

                            SET @RGL_P =0;
                            IF @RGL <> 0 AND @Cost_Amount_Baht != 0
                            BEGIN
                                SET @RGL_P =  ROUND(@RGL/@Cost_Amount_Baht * 100,2)
                            END
                          END;

                          INSERT INTO @temp
                            SELECT @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@RGL_P,@Act_ExecDate

                            FETCH NEXT FROM MFTS_Transaction_cursor INTO @amcNameE,@fundNameT,@fundNameE,@Amc_Name,@FGroup_Code,@Fund_Code,@TranType_Code,@Fund_Id,@Seq_No,@Ref_NO,@TranDate,@Amount_Baht,@Amount_Unit,@Nav_Price,@Avg_Cost,@Cost_Amount_Baht,@RGL,@Act_ExecDate
                      END

                  CLOSE MFTS_Transaction_cursor
                  DEALLOCATE MFTS_Transaction_cursor

              -- OUTPUT
              SELECT * FROM @temp
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
//*********************** V.2 */
exports.getSummaryGroupByFundType = (req, res, next) => {

  var fncName = 'getCustomerInfo';
  var custCode = req.params.cusCode;

  logger.info( `API /summaryGroupByFundType - ${req.originalUrl} - ${req.ip} -custCode:${custCode}`);

  var queryStr = `
  BEGIN

  DECLARE @CustID VARCHAR(20) ='${custCode}';
  DECLARE @DataDate date;
  DECLARE @MKpriceDate date;
  DECLARE @MKpriceDate date;

  --Find the max date
  SELECT TOP 1  @DataDate = DataDate, @MKpriceDate =MarketPriceDate
  FROM [IT_CustPortValueEndDay]
  WHERE CustID= @CustID
  ORDER BY DataDate DESC;

  SELECT @MKpriceDate AS DataDate ,a.* , a.TOTAL_COST-a.AVG_COST AS UN_GL,ROUND(((a.TOTAL_COST-a.AVG_COST)/a.AVG_COST)*100,2)  AS UN_GL_P
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
  DECLARE @30d date;
  DECLARE @90d date;
  DECLARE @180d date;
  DECLARE @365Day date;
  DECLARE @2Y date;
  DECLARE @3Y date;

  -- First day
SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)

select @30d = DATEADD(d, -30, GETDATE())
select @90d = DATEADD(d, -90, GETDATE())
select @180d = DATEADD(d, -180, GETDATE())
select @365Day = DATEADD(d, -365, GETDATE())

select @2Y = DATEADD(year, -2, GETDATE())
select @3Y = DATEADD(year, -3, GETDATE())

SELECT *
FROM
  (SELECT ISNULL(SUM(a.RGL),0) GL_M1
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN  @30d AND GETDATE()) M1,

  (SELECT ISNULL(SUM(a.RGL),0) GL_M3
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN  @90d AND GETDATE()) M3,

  (SELECT ISNULL(SUM(a.RGL),0) AS GL_M6
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN  @180d AND GETDATE()) M6,

-- --      YTD
  (SELECT ISNULL(SUM(a.RGL),0) AS GL_YTD
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @firstDate AND GETDATE()) Y1,

--      365
  (SELECT ISNULL(SUM(a.RGL),0) AS GL_365
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @365Day AND GETDATE()) BYear,

--      2 Year
  (SELECT ISNULL(SUM(a.RGL),0) AS GL_2Y
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @2Y AND GETDATE()) B2Year,

--      3 Year
  (SELECT ISNULL(SUM(a.RGL),0) AS GL_3Y
      FROM [MFTS_Transaction] a
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    AND ExecuteDate BETWEEN @3Y AND GETDATE()) B3Year

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
  DECLARE @30d date;
  DECLARE @90d date;
  DECLARE @180d date;

  DECLARE @365Day date;
  DECLARE @2Y date;
  DECLARE @3Y date;

  -- First day

SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)
select @30d = DATEADD(d, -30, GETDATE())
select @90d = DATEADD(d, -90, GETDATE())
select @180d = DATEADD(d, -180, GETDATE())
select @365Day = DATEADD(d, -365, GETDATE())

select @2Y = DATEADD(year, -2, GETDATE())
select @3Y = DATEADD(year, -3, GETDATE())

SELECT *
FROM
 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_M1
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @30d AND @firstDate ) M1,

 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_M3
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @90d AND @firstDate) M3,

 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_M6
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @180d AND @firstDate) M6,

-- YTD
 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_YTD
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @firstDate AND GETDATE()) YTD,

--  365
 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_365
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @365Day AND GETDATE()) D365,

--  2 Year
 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_2Y
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @2Y AND GETDATE()) Y2,
--  3 Year
 (SELECT ISNULL(SUM(a.DivPerUnit * a.Unit),0) AS DIV_3Y
    FROM [MFTS_Dividend] a
    LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    WHERE a.Ref_No=x.Ref_No
    AND x.Account_No= @CustID
    AND XD_DATE BETWEEN @3Y AND GETDATE()) Y3

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

  DECLARE @30d date;
  DECLARE @90d date;
  DECLARE @180d date;

  DECLARE @365Day date;
  DECLARE @2Y date;
  DECLARE @3Y date;

  DECLARE @UNGL_YTD_VAL [numeric](18, 2);

  -- First day
SELECT   @firstDate = DATEADD(yy, DATEDIFF(yy, 0, GETDATE()), 0)
select @30d = DATEADD(d, -30, GETDATE())
select @90d = DATEADD(d, -90, GETDATE())
select @180d = DATEADD(d, -180, GETDATE())
select @365Day = DATEADD(d, -365, GETDATE())

select @2Y = DATEADD(year, -2, GETDATE())
select @3Y = DATEADD(year, -3, GETDATE())


-- -- Calculate for  whole year , -1 year, -2 year
-- SELECT @UNGL_YTD_VAL= SUM( a.TOTAL_COST-a.AVG_COST)
--   FROM
--   (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
--     FROM [IT_CustPortValueEndDay] a
--     LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
--     LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
--     WHERE  Status ='A'
--     AND CustID= @CustID
--     AND DataDate = (SELECT MAX(DataDate) from IT_CustPortValueEndDay where Status ='A' AND CustID= @CustID)
--   GROUP BY b.FGroup_Code
--   ) a

-- Return values
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
    AND DataDate = @30d
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
    AND DataDate = @90d
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
    AND DataDate = @180d
  GROUP BY b.FGroup_Code
  ) a ) cc,

-- YTD
    -- (SELECT @UNGL_YTD_VAL AS  UNGL_YTD ) dd,
    (SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_YTD
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate = (SELECT MAX(DataDate) from IT_CustPortValueEndDay where Status ='A' AND CustID= @CustID)
  GROUP BY b.FGroup_Code
  ) a ) dd,

  -- (-365)
--   (SELECT @UNGL_YTD_VAL AS   UNGL_365) y1,
(SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_365
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate = @365Day
  GROUP BY b.FGroup_Code
  ) a ) ee,

  -- 2 Year
--   (SELECT @UNGL_YTD_VAL AS  UNGL_2Y) y2,
(SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_2Y
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate = @2Y
  GROUP BY b.FGroup_Code
  ) a ) ff,

  -- 3 Year
--   (SELECT @UNGL_YTD_VAL AS  UNGL_3Y) y3
(SELECT SUM( a.TOTAL_COST-a.AVG_COST) AS UNGL_3Y
  FROM
  (SELECT b.FGroup_Code AS FUND_TYPE,SUM(AvgCost) AS AVG_COST,SUM(MarketValue) AS TOTAL_COST
    FROM [IT_CustPortValueEndDay] a
    LEFT JOIN   [MFTS_Fund] b ON a.FundID = b.Fund_Id
    LEFT JOIN  [MFTS_Amc] c ON a.AMCID = c.Amc_Id
    WHERE  Status ='A'
    AND CustID= @CustID
    AND DataDate = @2Y
  GROUP BY b.FGroup_Code
  ) a ) gg
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

  if (fromDate ==='' ){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    fromDate = `${year}-01-01`;
    // console.log('*** Setting fromDate '+ fromDate);
  }

  if (toDate ===''){
    var currentTime = new Date()
    var year = currentTime.getFullYear()
    toDate = `${year}-12-31`;
    // console.log('*** Setting toDate '+toDate);
  }


  logger.info( `API /summaryOnSell - ${req.originalUrl} - ${req.ip} -custCode:${custCode} -fromDate:${fromDate} -toDate:${toDate}`);

  var queryStr = `
  BEGIN
  DECLARE @CustID VARCHAR(20) ='${custCode}';


DECLARE @CustID VARCHAR(20) = '${custCode}';
DECLARE @fromDate date = '${fromDate}';
DECLARE @toDate date = '${toDate}';

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
  DECLARE @Act_ExecDate Date;


  DECLARE MFTS_Transaction_cursor CURSOR LOCAL  FOR
  SELECT b.FGroup_Code  ,a.Fund_Id,a.Seq_No,a.Ref_No
  ,a.Amount_Baht
  ,a.Amount_Unit
  , a.Amount_Unit * a.Avg_Cost
  ,a.RGL
  ,a.Act_ExecDate
      FROM [MFTS_Transaction] a
      LEFT JOIN   [MFTS_Fund] b ON a.Fund_Id = b.Fund_Id
    , [MFTS_Account] x
    where a.Ref_No=x.Ref_No
    AND a.Status_Id=7
    AND TranType_Code IN ('S','SO')
    AND x.Account_No= @CustID
    -- AND ExecuteDate BETWEEN '${fromDate}' AND '${toDate}'
    AND ExecuteDate BETWEEN @fromDate AND @toDate
    ORDER BY ExecuteDate DESC

    OPEN MFTS_Transaction_cursor
        FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL,@Act_ExecDate

            WHILE @@FETCH_STATUS = 0
            BEGIN
                select @Avg_Cost = AvgCostPerUnit from MIT_AverageCostPerUnit(@Ref_NO,@Fund_Id,@Act_ExecDate)
                SET @Cost_Amount_Baht  =  ISNULL(@Amount_Unit,0)  * ISNULL(@Avg_Cost,0)

                -- SUM 1
                SET  @SUM_Amount_Baht  += @Amount_Baht;

                -- SUM 2
                SET @SUM_Cost_Amount_Baht += ISNULL(@Cost_Amount_Baht,0);

                -- SUM 3
                -- SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ISNULL(@RGL,0)
                SET  @SUM_RGL =  ISNULL(@SUM_RGL,0) + ( ISNULL(@Amount_Baht,0) - ISNULL(@Cost_Amount_Baht,0))

                FETCH NEXT FROM MFTS_Transaction_cursor INTO @FGroup_Code,@Fund_Id,@Seq_No,@Ref_NO,@Amount_Baht,@Amount_Unit,@Cost_Amount_Baht,@RGL,@Act_ExecDate
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
