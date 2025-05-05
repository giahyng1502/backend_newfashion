var express = require('express');
const subCategoryController = require("../controller/subCateController");
const { userMiddle, verifyAdmin, verifyAdminOrStaff} = require("../middleware/AuthMiddle");
const {upload} = require("../lib/cloudflare");  // Import middleware kiểm tra quyền admin
var router = express.Router();
//
router.get('/:categoryId', subCategoryController.getSubCateByCategory);  // Lấy danh sách danh mục
router.get('/getSubCate/getAll', subCategoryController.getAllSubCategories);  // Lấy danh sách danh mục

router.post('/', verifyAdminOrStaff,upload.array('files',1), subCategoryController.addSubCategories);
router.put('/:id', verifyAdminOrStaff,upload.array('files',1), subCategoryController.updateSubCategories);
router.delete('/:id', verifyAdminOrStaff, subCategoryController.deleteSubCategories);

module.exports = router;
