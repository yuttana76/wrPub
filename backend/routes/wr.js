
const express = require("express");

const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const wrController = require('../controllers/wr')

router.get("", wrController.getWrInfo);
router.get("/custInfo/:cusCode", checkAuth, wrController.getCustomerInfo);
router.get("/account/:cusCode", checkAuth, wrController.getAccountByCustID);
router.get("/summary/:cusCode",  checkAuth, wrController.getSummaryByCustID);
router.get("/onSell/:cusCode",  checkAuth, wrController.getFromSell);
router.get("/dividend/:cusCode",  checkAuth, wrController.getDividendByCustID);
router.get("/transaction/:cusCode",  checkAuth, wrController.getTransaction);

//*********************** V.2 */
router.get("/summaryGroupByFundType/:cusCode",  checkAuth, wrController.getSummaryGroupByFundType);
router.get("/summaryGainLossByM/:cusCode",  checkAuth, wrController.getSummaryGainLoss);
router.get("/summaryDividendByM/:cusCode",  checkAuth, wrController.getSummaryDividendByMonth);
router.get("/summaryUNGainLossByM/:cusCode",  checkAuth, wrController.getSummaryUNGainLoss);

router.get("/summaryOnSell/:cusCode",  checkAuth, wrController.getSummaryOnSell);
router.get("/summaryDividend/:cusCode",  checkAuth, wrController.getSummaryDividend);
router.get("/summaryTransaction/:cusCode",  checkAuth, wrController.getSummaryTransaction);

module.exports = router;
