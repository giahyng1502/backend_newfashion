const { Comment, Post, Reply } = require("../models/postModel");

const commentController = {
    // ✅ Lấy danh sách bình luận (có thêm tổng số comment)
     getComment : async (req, res) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        try {
            const { postId } = req.params;

            // Lấy tổng số comment để phân trang
            const totalComments = await Comment.countDocuments({ postId });

            // Lấy danh sách comment
            const comments = await Comment.find({ postId })
                .populate({ path: "user", select: "name avatar" })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit);

            // Với mỗi comment, lấy tối đa 2 reply
            const dataReturn = await Promise.all(
                comments.map(async (comment) => {
                    const replies = await Reply.find({ commentId: comment._id })
                        .populate({ path: "user", select: "name avatar" })
                        .sort({ createdAt: 1 })
                        .limit(2);

                    return {
                        ...comment.toObject(),
                        replies: replies.map(reply => reply.toObject()),
                    };
                })
            );

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
};

module.exports = commentController;
