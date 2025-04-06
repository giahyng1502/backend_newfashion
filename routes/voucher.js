var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const voucherController = require("../controller/voucherController");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',voucherController.getByUser);

router.get('/getAllVoucher',verifyAdmin,voucherController.getAll);

// router.get('/checkVoucher',voucherController.checkVoucher);

router.post('/create',verifyAdmin,voucherController.createVoucher);

router.put('/update/:voucherId',verifyAdmin,voucherController.updateVoucher);

router.delete('/delete/:voucherId',verifyAdmin,voucherController.removeVoucher);
module.exports = router;
