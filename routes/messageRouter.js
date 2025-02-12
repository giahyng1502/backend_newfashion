var express = require('express');
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");
const { getUsersForSidebar, getMessages, sendMessage } = require("../controller/messageController.js");
const { upload } = require("../lib/cloudflare");
var router = express.Router();

// Route để lấy danh sách người dùng
router.get("/users", userMiddle, getUsersForSidebar);

// Route để lấy tin nhắn giữa người dùng
router.get("/:id", userMiddle, getMessages);

// Route gửi tin nhắn (với các tệp đính kèm)
router.post("/send/:id", userMiddle, upload.array('files', 5), sendMessage);

// Xuất router để sử dụng ở nơi khác
module.exports = router;
