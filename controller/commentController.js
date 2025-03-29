const { Comment, Post, Reply } = require("../models/postModel");

const commentController = {
    // ✅ Lấy danh sách bình luận (có thêm tổng số comment)
    getComment: async (req, res) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;
        const userId = req.user.userId;

        try {
            const { postId } = req.params;

            // Lấy tổng số comment để hỗ trợ phân trang
            const totalComments = await Comment.countDocuments({ postId });

            // Lấy danh sách comment có phân trang
            const comments = await Comment.find({ postId })
                .populate({ path: "user", select: "name avatar" })
                .skip(skip)
                .limit(limit)
            const dataReturn = comments.map((comment) => ({
                ...comment.toObject(),
                likes: comment.likes.length,
                isLike: comment.likes.includes(userId),
            }));

            return res.status(200).json({
                message: "Lấy danh sách bình luận thành công",
                data: dataReturn,
                totalComments,
                totalPages: Math.ceil(totalComments / limit),
                currentPage: page,

            });
        } catch (e) {
            console.error("Lỗi khi lấy danh sách bình luận:", e);
            return res.status(500).json({ message: e.message });
        }
    },

    // ✅ Thêm bình luận vào bài viết
    commentPost: async (req, res) => {
        try {
            const user = req.user.userId;
            const { content } = req.body;
            const { postId } = req.params;

            const newComment = new Comment({ user, content, postId });
            await newComment.save();

            // Cập nhật `commentCount`
            await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } })

            return res.status(201).json({ success: true, comment: newComment });
        } catch (error) {
            console.error("Lỗi khi thêm bình luận:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // ✅ Xoá comment + reply
    deleteComment: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { commentId } = req.params;

            // Tìm comment trước khi xoá
            const comment = await Comment.findOne({ _id: commentId, user: userId });

            if (!comment) {
                return res.status(404).json({ success: false, message: "Comment không tồn tại hoặc bạn không có quyền xoá." });
            }

            // Xoá comment và reply đồng thời
            await Promise.all([
                Reply.deleteMany({ commentId }),
                Comment.deleteOne({ _id: commentId }),
                Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } })
            ]);

            return res.status(200).json({ success: true, message: "Xoá comment và các reply thành công" });
        } catch (error) {
            console.error("Lỗi xoá comment:", error);
            return res.status(500).json({ success: false, message: "Lỗi server" });
        }
    },

    // ✅ Like/Unlike comment
    likeComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: 'Bình luận không tồn tại' });
            }

            const isLiked = comment.likes.includes(userId);
            if (isLiked) {
                comment.likes = comment.likes.filter(id => id.toString() !== userId);
            } else {
                comment.likes.push(userId);
            }

            await comment.save();
            return res.status(200).json({
                message: isLiked ? 'Đã bỏ like bình luận' : 'Đã like bình luận',
                totalLikes: comment.likes.length,
                isLike: !isLiked
            });
        } catch (error) {
            console.error("Lỗi khi like/unlike bình luận:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
};

module.exports = commentController;
