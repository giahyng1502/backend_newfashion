const express = require("express");
const router = express.Router();
const { createMessage } = require("../controller/messageController");
const { userMiddle } = require("../middleware/AuthMiddle");
router.post("/", userMiddle, createMessage); // Tạo tin nhắn mới
// router.get('/messages/:sender/:receiver', getMessages);  // Lấy tin nhắn của cuộc trò chuyện
// router.put('/message/:messageId', updateMessage);  // Cập nhật trạng thái tin nhắn
// router.delete('/message/:messageId', deleteMessage);  // Xóa tin nhắn

module.exports = router;
