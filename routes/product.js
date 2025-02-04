var express = require('express');
const productController = require("../controller/productController");
const reviewController = require("../controller/ReviewController");
const ReviewController = require("../controller/ReviewController");
var router = express.Router();

/* GET home page. */
router.get('/', productController.getAll);
router.post('/addProduct', productController.AddProduct);
router.get('/getOne/:productId', productController.getOne);
router.put('/putReview/:productId', reviewController.addReview);
router.put('/updateProduct/:productId', productController.updateProduct);
router.put('/deleteReview/:productId', ReviewController.deleteReview);

module.exports = router;
