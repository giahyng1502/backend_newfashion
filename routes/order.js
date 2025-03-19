var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const orderController = require("../controller/orderController");
var router = express.Router();

/* GET users listing. */
router.post('/create',userMiddle,orderController.create);
router.get('/getAll',orderController.getAll);
router.get('/getOrderUser',userMiddle,orderController.getOrderById);
router.put('/cancel/:orderId',userMiddle,orderController.cancelOrder);
router.put('/update/:orderId',verifyAdmin,orderController.updateStatus);
router.get('/search',verifyAdmin,orderController.searchOrderByUser);

module.exports = router;
