const express = require("express");
const { userMiddle } = require("../middleware/AuthMiddle");
const replyController = require("../controller/replyController");

const router = express.Router();

// Lấy danh sách reply của một comment
router.get("/:commentId", replyController.getReply);

// Thêm một reply mới vào comment
router.post("/:commentId", userMiddle, replyController.replyPost);

// Xoá một reply
router.delete("/:replyId", userMiddle, replyController.deleteReply);

module.exports = router;
