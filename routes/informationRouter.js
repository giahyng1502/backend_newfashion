var express = require('express');
const informationController = require("../controller/informationController");
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
var router = express.Router();

/* Quản lý thông tin cá nhân (Cần đăng nhập) */
router.put('/:inforId', userMiddle, informationController.upsertInformation); // Cập nhật thông tin
router.post('/', userMiddle, informationController.addInfor); // Thêm thông tin mới
router.delete('/:id', userMiddle, informationController.deleteInformation); // Xóa thông tin

module.exports = router;
