
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const dbConfig = require('./config');
const dbConfig = require('../config/db-config');
const wr_properties = require('../config/wr-properties');

var logger = require('../config/winston');

var config = dbConfig.dbParameters;

// const SALT_WORK_FACTOR = 10;
const SALT_WORK_FACTOR = dbConfig.SALT_WORK_FACTOR;

const TOKEN_SECRET_STRING = dbConfig.TOKEN_SECRET_STRING;
const TOKEN_EXPIRES = dbConfig.TOKEN_EXPIRES;
const TOKEN_EXPIRES_SEC = 3600;

exports.userLoginByParam = (req, res, next) => {

  let fetchedUser;
  let _userName = req.body.email
  logger.info( `API /Login (ByParam)- ${req.originalUrl} - ${req.ip} - ${_userName}`);

  let queryStr = `SELECT a.*
                        ,b.Title_Name_E + ' ' + b.First_Name_T + ' ' + b.Last_Name_T FULLNAME
                 FROM [MIT_USERS] a
                 LEFT JOiN MIT_Account_Profile b ON a.USERID = b.CUST_CODE
                 WHERE STATUS = 'A'  AND CURRENT_TIMESTAMP < ISNULL(EXPIRE_DATE,CURRENT_TIMESTAMP+1)
                 AND LoginName=@input_userName`;

  const sql = require('mssql')

 sql.connect(config).then(pool => {
    // Query
    return pool.request()
    .input('input_userName', sql.VarChar(50), _userName)
    .query(queryStr)})
    .then(user => {

      if(!user){
       logger.error( `API /Login  System error - ${req.originalUrl} - ${req.ip} `);
       sql.close();

       const _loginCode ='101';

        return res.status(401).json({
          MSG_CODE: _loginCode,
          MSG_DESC: getLogiMsg(_loginCode)
        });
      } else {
         sql.close();
         fetchedUser = user;
         return bcrypt.compare(req.body.password,user.recordset[0].PASSWD);
      }

    })
    .then(result =>{

      if(!result){
      // ***** INCORRECT PWD.
        let _loginCode ='101';

        // Save login fail log
        loginProcessLog(_userName,_loginCode,req.ip,req.originalUrl)
        .then(function(data) {

          // Check was user lock ?
          // If user lock will return user lock message.
          if(data.UserWasLock ==='Y'){
            _loginCode = '102';
          }

          return res.status(401).json({
            MSG_CODE: _loginCode,
            MSG_DESC: getLogiMsg(_loginCode)
          });

        }).catch(function(err) {
          console.log("It failed!", err);
        })

      }else{
        // CORRECT PWD
        let _loginCode ='000';

          // Check was user lock ?
          // If user locked return login fail
          if(fetchedUser.recordset[0].userLock ==='Y'){
            _loginCode ='102';
            return res.status(401).json({
              MSG_CODE: _loginCode,
              MSG_DESC: getLogiMsg(_loginCode)
            });
          }

          // Save login success log
          loginProcessLog(_userName,_loginCode,req.ip,req.originalUrl)
        .then(function(data) {

          console.log(' ***** data >> ' +JSON.stringify(data));

          if(data.UserWasLock ==='Y'){
            _loginCode ='102';

          }else if(data.isFirstTime ==='Y'){
            _loginCode ='202';

          }else if(data.expPwd ==='Y'){

            _loginCode ='203';

            var _msg = getLogiMsg(_loginCode);
            saveLoginLog(_userName,_loginCode,_msg,req.ip,req.originalUrl)

            return res.status(401).json({
              MSG_CODE: _loginCode,
              MSG_DESC: getLogiMsg(_loginCode)
            });
          }


                //Generate token
              const token = jwt.sign(
                {USERID: fetchedUser.recordset[0].USERID},
                TOKEN_SECRET_STRING,
                { expiresIn: TOKEN_EXPIRES},
              );

              res.status(200).json({
                token: token,
                expiresIn: TOKEN_EXPIRES_SEC,//3600 = 1h
                userData: fetchedUser.recordset[0].USERID,
                LoginName: fetchedUser.recordset[0].LoginName,
                USERID: fetchedUser.recordset[0].USERID,
                FULLNAME: fetchedUser.recordset[0].FULLNAME,
                MSG_CODE: _loginCode,
                MSG_DESC: getLogiMsg(_loginCode)
              });
        });

      }

      sql.close();
    })
    .catch(err => {
        // NOT FOUND USER
        logger.info( `API /Login Auth failed by no user - ${_userName} -${err}`);
        sql.close();

        const _loginCode ='101';

        return res.status(401).json({
          MSG_CODE: _loginCode,
          MSG_DESC: getLogiMsg(_loginCode)
        });
    })

  sql.on("error", err => {
   err.message
    sql.close();
    logger.error( `API /Login error - ${req.originalUrl} - ${req.ip} - ${err} `);

    const _loginCode ='101';
    return res.status(401).json({
      MSG_CODE: _loginCode,
      MSG_DESC: getLogiMsg(_loginCode)
    });

  });
 }


exports.createUser = (req,res,next)=>{

  logger.info( `API /register - ${req.originalUrl} - ${req.ip} - ${req.body.email}`);

  var _userName = req.body.email
  bcrypt.hash(req.body.password, SALT_WORK_FACTOR)
  .then(hash =>{

      var queryStr = `INSERT INTO   [MIT_USERS] (LoginName,USERID,PASSWD,EMAIL,STATUS,CREATEBY,CREATEDATE)
                      VALUES('${_userName}','${_userName}','${hash}','${_userName}','A','WEB-APP',GETDATE());`;

      var sql = require("mssql");

      sql.connect(config, err => {
        new sql.Request().query(queryStr, (err, result) => {
          sql.close();
            if(err){
              res.status(500).json({
                error:err
              });

            } else {
              res.status(200).json({
                message: 'User created',
                result: result
              });
            }

        })

      });

      sql.on("error", err => {

        logger.error( `API /register - ${err}`);

        sql.close();
        res.status(500).json({
          error:err
        });
      });
  });
}

exports.resetPassword = (req,res,next)=>{

  logger.info( `API /resetPassword - ${req.originalUrl} - ${req.ip} - ${req.body.LoginName}`);

  var input_userName = req.body.LoginName;
  var newPassword = req.body.newPassword;
  var idCard = req.body.id;
  var RESET_PWD_CODE = '901';

  bcrypt.hash(newPassword, SALT_WORK_FACTOR)
  .then(hash =>{

      var queryStr = `
                        BEGIN

                        DECLARE @msg_code  VARCHAR(250) ='104';
                        DECLARE @FOUND_USER INT ;
                        DECLARE @LOGIN_PWD_EXP_DAY INT = ${wr_properties.LOGIN_PWD_EXP_DAY};

                        SELECT @FOUND_USER = COUNT(*)
                        FROM MIT_Account_Info_ext a, MIT_USERS b
                              WHERE   a.UserId = b.USERID
                              AND a.STATUS = 'A'
                              AND b.LoginName=@input_userName
                              AND a.USERID =@idCard  -- ID card

                            IF @FOUND_USER>0
                            BEGIN

                              DECLARE @expPwd_in date;

                              select @expPwd_in = DATEADD(d, +@LOGIN_PWD_EXP_DAY, GETDATE())

                                UPDATE [MIT_USERS]
                                SET PASSWD='${hash}',UPDATEBY='WEB-APP',UPDATEDATE=GETDATE()
                                ,NologinFail = 0 ,userLock ='N',isFirstTime='N',expPwd =@expPwd_in
                                WHERE LoginName=@input_userName

                                SET @msg_code ='001'
                            END;

                            SELECT   @msg_code  AS  msg_code
                        END
                      `;

      const sql = require('mssql')
      const pool1 = new sql.ConnectionPool(config, err => {
        pool1.request() // or: new sql.Request(pool1)
        .input('input_userName', sql.VarChar(50), input_userName)
        .input('idCard', sql.VarChar(50), idCard)
        .query(queryStr, (err, result) => {
            if(err){
              res.status(500).json({
                errMsg:err
              });
            }else {

              console.log('msg_code>>' + JSON.stringify(result.recordsets[0][0]));

              if (result.recordsets[0][0].msg_code==='001'){
                var _msg = getLogiMsg(RESET_PWD_CODE);
                saveLoginLog(input_userName,RESET_PWD_CODE,_msg,req.ip,req.originalUrl)
              }

              res.status(200).json({
                MSG_CODE: result.recordsets[0][0].msg_code,
                MSG_DESC: getLogiMsg(result.recordsets[0][0].msg_code)
              });
            }
        })
      })

      pool1.on('error', err => {
        console.log("EROR>>"+err);
      })

  });
}


exports.getUserLevel = (req, res, next) => {

  var _userId = req.query.userId || '';
  var _appId = req.query.appId || '';

  // console.log(' getUserLevel() _userId>>' + _userId + ' ;_appId>>' + _appId );
  logger.info( `API /UserLevel - ${req.originalUrl} - ${req.ip} - ;USERID=${_userId}  ;APPID=${_appId}`);

  var fncName = 'getUserLevel';
  var queryStr = `
    SELECT * from MIT_Users_Level
    WHERE STATUS = 'A'  AND CURRENT_TIMESTAMP < ISNULL(EXPIRE_DATE,CURRENT_TIMESTAMP+1)
    AND USERID = '${_userId}'
    AND APPID = '${_appId}'
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



exports.getUserInfo = (req, res, next) => {

  var _userId = req.query.userId || '';

  console.log('getUserInfo() _userId>>' + _userId );

  var fncName = 'getUserInfo';
  var queryStr = `
  SELECT USERID,EMAIL,DEP_CODE
  FROM MIT_USERS
  WHERE USERID='${_userId}'
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


function getLogiMsg(_code){

  const loginMsg = wr_properties.loginMsg;
  return loginMsg[_code];
}


function loginProcessLog(_userName,_loginCode,_ip,_url) {

    const LOGIN_FAIL_LOCK_NO = wr_properties.LOGIN_FAIL_LOCK_NO;
    return new Promise(function(resolve, reject) {
    // const _NO =1;
    var queryStr = `
    BEGIN

    DECLARE @loginFailCode  VARCHAR(20) ='101';
    DECLARE @codeLocked  VARCHAR(20) ='902';
    DECLARE @failMaxNO  INT = ${LOGIN_FAIL_LOCK_NO};
    DECLARE @CurrentNO  INT;

    DECLARE @UserWasLock  VARCHAR(1) ='N';
    DECLARE @isFirstTime  VARCHAR(1) ='N';
    DECLARE @expPwd  VARCHAR(1) ='N';

    INSERT INTO MIT_USERS_LOG(LoginName,LogDateTime,LoginResultCode,ip,url)
    VALUES('${_userName}',GETDATE(),'${_loginCode}','${_ip}','${_url}');

      IF ${_loginCode} IN  ( @loginFailCode )
      BEGIN
        -- login Fail
        SELECT @CurrentNO =(ISNULL(NologinFail,0) +1) FROM MIT_USERS WHERE LoginName = '${_userName}';

        UPDATE  MIT_USERS SET NologinFail = @CurrentNO
        WHERE LoginName = '${_userName}';

        SELECT @CurrentNO = NologinFail  FROM MIT_USERS WHERE LoginName = '${_userName}';

        IF @CurrentNO >= @failMaxNO
        BEGIN
          --Lock user
          SET @UserWasLock  = 'Y';

          UPDATE  MIT_USERS SET userLock = @UserWasLock
          WHERE LoginName = '${_userName}';

          INSERT INTO MIT_USERS_LOG(LoginName,LogDateTime,LoginResultCode,ip,url)
          VALUES('${_userName}',GETDATE(),@codeLocked,'${_ip}','${_url}');

        END;

      END
      ELSE
        BEGIN
          -- login success
          -- Reset NologinFail
          UPDATE  MIT_USERS SET NologinFail = 0
          WHERE LoginName = '${_userName}';

        END;

      --SELECT   @UserWasLock  AS  UserWasLock

        SELECT  userLock AS UserWasLock,
        isFirstTime,
        CASE WHEN DATEDIFF(day, GETDATE(), expPwd) > 0 THEN 'N' ELSE 'Y' END    AS expPwd
        FROM MIT_USERS
        WHERE LoginName = '${_userName}';

    END
    `;

    const sql = require('mssql')
    const pool1 = new sql.ConnectionPool(config, err => {
      pool1.request().query(queryStr, (err, result) => {

          if(err){
            reject(err);

          }else {
            resolve(result.recordsets[0][0]);

          }
        })
    })

  });

  }


function saveLoginLog(_userName,_loginCode,log_msg,_ip,_url) {

  // const _NO =1;
  var queryStr = `
  BEGIN

    INSERT INTO MIT_USERS_LOG(LoginName,LogDateTime,LoginResultCode,log_msg,ip,url)
    VALUES('${_userName}',GETDATE(),'${_loginCode}','${log_msg}','${_ip}','${_url}');

  END
  `;

  const sql = require('mssql')
  const pool1 = new sql.ConnectionPool(config, err => {
    pool1.request().query(queryStr, (err, result) => {

        if(err){
          return err;

        }else {
          return null;
        }
      })
  })



}

