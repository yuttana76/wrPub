
const express = require("express");

const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const wrController = require('../controllers/wr')

router.get("", wrController.getWrInfo);
router.get("/custInfo/:cusCode", checkAuth, wrController.getCustomerInfo);
router.get("/account/:cusCode", checkAuth, wrController.getAccountByCustID);
router.get("/summary/:cusCode",  checkAuth, wrController.getSummaryByCustID);
router.get("/dividend/:cusCode",  checkAuth, wrController.getDividendByCustID);
router.get("/onSell/:cusCode",  checkAuth, wrController.getFromSell);
router.get("/transaction/:cusCode",  checkAuth, wrController.getTransaction);

//*********************** V.2 */
router.get("/summaryGroupByFundType/:cusCode",  checkAuth, wrController.getSummaryGroupByFundType);
module.exports = router;
