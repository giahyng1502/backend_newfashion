var express = require('express');
const subCategoryController = require("../controller/subCateController");
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");
const {upload} = require("../lib/cloudflare");  // Import middleware kiểm tra quyền admin
var router = express.Router();
//
router.get('/:categoryId', subCategoryController.getSubCateByCategory);  // Lấy danh sách danh mục

router.post('/', verifyAdmin,upload.array('files',1), subCategoryController.addSubCategories);
router.put('/:id', verifyAdmin,upload.array('files',1), subCategoryController.updateSubCategories);
router.delete('/:id', verifyAdmin, subCategoryController.deleteSubCategories);

module.exports = router;
