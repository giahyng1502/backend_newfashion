var express = require('express');
const categoryController = require("../controller/categoryController");  // Import controller của category
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");  // Import middleware kiểm tra quyền admin
var router = express.Router();

/* GET category listing. */
router.get('/', categoryController.getAllCategories);  // Lấy danh sách danh mục

/* CREATE a new category. */
router.post('/', verifyAdmin, categoryController.createCategory);  // Tạo mới danh mục (Chỉ admin có quyền)

/* UPDATE category by ID. */
router.put('/:id', verifyAdmin, categoryController.updateCategory);  // Cập nhật danh mục theo ID (Chỉ admin có quyền)

/* DELETE category by ID. */
router.delete('/:id', verifyAdmin, categoryController.deleteCategory);  // Xóa danh mục theo ID (Chỉ admin có quyền)

module.exports = router;
