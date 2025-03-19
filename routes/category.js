var express = require('express');
const categoryController = require("../controller/categoryController");  // Import controller của category
const subCategoryController = require("../controller/subCateController");
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");
const {upload} = require("../lib/cloudflare");  // Import middleware kiểm tra quyền admin
var router = express.Router();

/* GET category listing. */
router.get('/', categoryController.getAllCategories);  // Lấy danh sách danh mục
router.get('/subcate/:id', subCategoryController.getSubCateByCategory);  // Lấy danh sách danh mục
router.get('/getProduct/:id', categoryController.getProductCategories);  // sản phẩm theo danh mục sản phẩm

/* CREATE a new category. */
router.post('/', verifyAdmin,upload.array('files',1), categoryController.createCategory);  // Tạo mới danh mục (Chỉ admin có quyền)

// router.post('/subcate', verifyAdmin,upload.array('files',1), subCategoryController.addSubCategories);  // Tạo mới danh mục (Chỉ admin có quyền)

/* UPDATE category by ID. */
router.put('/:id', verifyAdmin, categoryController.updateCategory);  // Cập nhật danh mục theo ID (Chỉ admin có quyền)

/* DELETE category by ID. */
router.delete('/:id', verifyAdmin, categoryController.deleteCategory);  // Xóa danh mục theo ID (Chỉ admin có quyền)

module.exports = router;
