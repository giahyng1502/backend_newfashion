var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const voucherController = require("../controller/voucherController");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',voucherController.getAll);

// router.get('/checkVoucher',voucherController.checkVoucher);

router.post('/create',voucherController.createVoucher);

router.put('/update/:voucherId',voucherController.updateVoucher);

router.delete('/delete/:voucherId',voucherController.removeVoucher);
module.exports = router;
