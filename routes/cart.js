var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const cartController = require("../controller/cartController");
var router = express.Router();

/* GET users listing. */
router.get('/getCart',userMiddle,cartController.getCart);
router.post('/addToCart',userMiddle,cartController.addToCart);
router.post('/updateCart',userMiddle,cartController.updateCart);
router.post('/removeFromCart',userMiddle,cartController.removeFromCart);

module.exports = router;
