const express = require("express");
const { userMiddle } = require("../middleware/AuthMiddle");
const commentController = require("../controller/commentController");

const router = express.Router();

// Lấy danh sách bình luận của bài viết
router.get("/:postId", userMiddle, commentController.getComment);

// Thêm bình luận vào bài viết
router.post("/:postId", userMiddle, commentController.commentPost);

// Xóa bình luận
router.delete("/:commentId", userMiddle, commentController.deleteComment);

// Like/Unlike một bình luận
router.post("/like/:commentId", userMiddle, commentController.likeComment);

module.exports = router;
