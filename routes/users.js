var express = require('express');
const UserController = require("../controller/UserController");
const informationController = require("../controller/informationController");
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const {uploadImage, upload} = require("../lib/cloudflare");
const {saveVoucherToWallet, getUserVouchers} = require("../controller/userVoucherController");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',verifyAdmin,UserController.getUsers)

router.get('/getMe',userMiddle,UserController.getMe)

router.post('/checkEmail',UserController.getUserByEmail)

router.get('/search',verifyAdmin,UserController.searchUsers)

router.post('/register',UserController.register);

router.post('/saveVoucher',userMiddle,saveVoucherToWallet);

router.get('/getVoucher',userMiddle,getUserVouchers);

router.put('/adminUpdateUser/:id',verifyAdmin,UserController.adminUpdateUser);

router.post('/login',UserController.login);

router.post('/loginWithGoogle',UserController.loginWithGoogle);

router.put('/update',userMiddle,upload.array('files',1),UserController.updateUser);

module.exports = router;
