var express = require('express');
const informationController = require("../controller/informationController");
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
var router = express.Router();

/* Quản lý thông tin cá nhân (Cần đăng nhập) */
router.put('/:inforId', userMiddle, informationController.updateInformation); // Cập nhật thông tin
router.put('/default/:inforId', userMiddle, informationController.setDefaultInformation);
router.post('/', userMiddle, informationController.addInfor); // Thêm thông tin mới
router.delete('/:inforId', userMiddle, informationController.deleteInformation); // Xóa thông tin

module.exports = router;
