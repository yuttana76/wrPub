
const express = require("express");

const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const wrController = require('../controllers/wr')

router.get("", wrController.getWrInfo);
router.get("/custInfo/:cusCode", checkAuth, wrController.getCustomerInfo);
router.post("/summary/:cusCode",  checkAuth, wrController.getSummaryByCustID);
router.post("/dividend/:cusCode",  checkAuth, wrController.getDividendByCustID);
router.post("/onSell/:cusCode",  checkAuth, wrController.getFromSell);
router.post("/transaction/:cusCode",  checkAuth, wrController.getTransaction);

module.exports = router;
