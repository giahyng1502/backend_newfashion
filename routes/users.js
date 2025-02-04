var express = require('express');
const UserController = require("../controller/UserController");
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
var router = express.Router();

/* GET users listing. */
router.get('/getAll',verifyAdmin,UserController.getUsers)
router.post('/register',UserController.register);
router.post('/login',UserController.login);
module.exports = router;
