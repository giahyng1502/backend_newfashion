var express = require('express');
const {verifyAdmin, verifyAdminOrStaff} = require("../middleware/AuthMiddle");
const bannerController = require("../controller/bannerController");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',bannerController.getAll);

router.post('/create',verifyAdminOrStaff, bannerController.addBanner)

router.delete('/delete/:bannerId',verifyAdminOrStaff, bannerController.deleteBanner)



module.exports = router;
