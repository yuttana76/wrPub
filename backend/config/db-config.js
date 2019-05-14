exports.dbParameters = {
  user: 'mftsuser',//process.env.AUTH_SRV_USER,
  password: 'P@ssw0rd',//process.env.AUTH_SRV_PWD,
  // server: '192.168.10.48', //Development
  server: '192.168.2.25', // Prod
  database: 'MFTS',// WR_MFTS
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false // Use this if you're on Windows Azure
  }
}

exports.SALT_WORK_FACTOR = 10;
exports.TOKEN_SECRET_STRING = 'secret_this_should_be_longer'//process.env.JWT_KEY;
exports.TOKEN_EXPIRES = '1h';

exports.UTIL_PRIVATE_CODE ='winteriscomming!';
