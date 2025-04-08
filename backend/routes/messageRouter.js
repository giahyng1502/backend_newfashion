const express = require("express");
const router = express.Router();
const { userMiddle } = require("../middleware/AuthMiddle");
const messageController = require("../controller/messageController");
router.post("/create", userMiddle, messageController.createMessage); // Tạo tin nhắn mới
router.get('/getMessages/:receiver', userMiddle,messageController.getMessage);  // Lấy tin nhắn của cuộc trò chuyện

module.exports = router;
