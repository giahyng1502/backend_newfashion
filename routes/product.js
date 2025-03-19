var express = require("express");
const productController = require("../controller/productController");
const reviewController = require("../controller/ReviewController");
const ReviewController = require("../controller/ReviewController");
const { upload } = require("../lib/cloudflare");
const { userMiddle } = require("../middleware/AuthMiddle");
var router = express.Router();

/* GET home page. */
router.get("/", productController.getAll);
router.post("/addProduct",productController.addProduct);
router.get("/getOne/:productId", productController.getOne);
router.put(
  "/putReview/:productId",
  userMiddle,
  upload.array("files", 5),
  reviewController.addReview
);
router.put("/updateProduct/:productId",productController.updateProduct);
router.put("/deleteReview/:productId", ReviewController.deleteReview);
router.get("/search", productController.searchProduct);

module.exports = router;
