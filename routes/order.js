var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const orderController = require("../controller/orderController");
var router = express.Router();

/* GET users listing. */
router.post('/create',userMiddle,orderController.create);
router.get('/search',verifyAdmin,orderController.searchOrder);
router.get('/getOrderUser',userMiddle,orderController.getOrderByUser);
router.put('/cancel/:orderId',userMiddle,orderController.cancelOrder);
router.put('/update/:orderId',verifyAdmin,orderController.updateStatus);

module.exports = router;
