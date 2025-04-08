var express = require('express');
const SaleProductController = require("../controller/saleProductControler");
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");
var router = express.Router();

/* Thêm sản phẩm giảm giá mới */
router.post('/add', verifyAdmin, SaleProductController.addSaleProduct);

/* Cập nhật giảm giá cho sản phẩm */
router.put('/update/:saleProductId', verifyAdmin, SaleProductController.updateSaleProduct);

/* Xóa giảm giá cho sản phẩm */
router.delete('/delete/:saleProductId', verifyAdmin, SaleProductController.deleteSaleProduct);

/* Lấy tất cả sản phẩm giảm giá */
router.get('/all', SaleProductController.getAllSaleProducts);

/* Lấy sản phẩm giảm giá theo ID */
router.get('/:saleProductId', SaleProductController.getSaleProductById);

module.exports = router;
