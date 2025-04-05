const { Comment, Reply, Post} = require("../models/postModel");

const replyController = {
    getReply: async (req, res) => {
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 5;

        try {
            const { commentId } = req.params;
            const replies = await Reply.find({commentId:commentId})
                .populate("user", "name avatar")
                .skip(offset)
                .limit(limit)
                .sort({createdAt: 1})
                .lean();
            return res.status(200).json({ message: "Lấy danh sách reply thành công", data: replies });
        } catch (e) {
            console.log("Lỗi khi lấy danh sách reply:", e);
            return res.status(500).json({ message: e.message });
        }
    },
    replyPost: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { content,postId } = req.body;
            const { commentId } = req.params;

            // Tạo reply mới
            console.log(req.body);
            const newReply = new Reply({ user: userId, content, commentId,postId });
            await newReply.save();

            // Thêm reply vào danh sách của comment
            await Comment.findByIdAndUpdate(
                commentId,
                {$inc: { replyCount: 1 } }, // Tăng replyCount
            );

            await Post.findByIdAndUpdate(postId,{$inc : {commentCount: 1}});

            return res.status(201).json({ success: true, reply: newReply });
        } catch (error) {
            console.log("Lỗi khi thêm reply:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    deleteReply: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { replyId } = req.params;

            // Tìm reply cần xoá
            const reply = await Reply.findById(replyId);
            if (!reply) {
                return res.status(404).json({ message: "Reply không tồn tại" });
            }

            // Kiểm tra quyền xoá
            if (reply.user.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền xoá reply này" });
            }

            // Xoá reply
            await Reply.findByIdAndDelete(replyId);

            // Xoá reply khỏi comment chứa nó
            await Comment.findByIdAndUpdate(
                reply.commentId,
                { $inc: { replyCount: -1 } }
            );

            return res.status(200).json({ success: true, message: "Xoá reply thành công" });
        } catch (error) {
            console.log("Lỗi xoá reply:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
};

module.exports = replyController;
