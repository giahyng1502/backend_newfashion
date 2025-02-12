var express = require("express");
const { userMiddle, verifyAdmin } = require("../middleware/AuthMiddle");
const {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  getSenderOfUser,
} = require("../controller/messageController.js");
const { upload } = require("../lib/cloudflare");
var router = express.Router();

// Route để lấy danh sách người dùng
router.get("/users", userMiddle, getUsersForSidebar);

// Route để lấy tin nhắn giữa người dùng
router.get("/getDetail:id", userMiddle, getMessages);

// Route gửi tin nhắn (với các tệp đính kèm)
router.post("/send/:id", userMiddle, upload.array("files", 5), sendMessage);

router.get("/getSenderOfUser", userMiddle, getSenderOfUser);

// Xuất router để sử dụng ở nơi khác
module.exports = router;
