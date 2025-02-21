var express = require('express');
const UserController = require("../controller/UserController");
const informationController = require("../controller/informationController");
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const {uploadImage, upload} = require("../lib/cloudflare");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',verifyAdmin,UserController.getUsers)
router.post('/register',UserController.register);
router.post('/login',UserController.login);
router.put('/update',userMiddle,upload.array('files',1),UserController.updateUser);

module.exports = router;
