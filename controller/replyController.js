const { Comment, Reply } = require("../models/postModel");

const replyController = {
    getReply: async (req, res) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;
        const userId = req.user.userId;

        try {
            const { commentId } = req.params;
            const replies = await Reply.find({ commentId })
                .populate("user", "name avatar")
                .skip(skip)
                .limit(limit)
                .lean();
            const totalComments = await Reply.countDocuments({commentId: commentId});
            const dataReturn = replies.map((reply) => {
                return {
                    ...reply,
                    likes: reply.likes.length,
                    isLike: reply.likes.includes(userId),
                    totalPages: Math.ceil(totalComments / limit),
                    totalReplies : totalComments,
                    currentPage: page,
                };
            });

            return res.status(200).json({ message: "Lấy danh sách reply thành công", data: dataReturn });
        } catch (e) {
            console.log("Lỗi khi lấy danh sách reply:", e);
            return res.status(500).json({ message: e.message });
        }
    },
    replyPost: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { content } = req.body;
            const { commentId } = req.params;

            // Tạo reply mới
            const newReply = new Reply({ user: userId, content, commentId });
            await newReply.save();

            // Thêm reply vào danh sách của comment
            await Comment.findByIdAndUpdate(
                commentId,
                {$inc: { replyCount: 1 } }, // Tăng replyCount
                { new: true }
            );

            res.status(201).json({ success: true, reply: newReply });
        } catch (error) {
            console.log("Lỗi khi thêm reply:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    likeReply: async (req, res) => {
        try {
            const { replyId } = req.params;
            const userId = req.user.userId;

            const reply = await Reply.findById(replyId);
            if (!reply) {
                return res.status(404).json({ message: "Reply không tồn tại" });
            }

            const isLiked = reply.likes.includes(userId);
            if (isLiked) {
                reply.likes = reply.likes.filter((id) => id.toString() !== userId); // Bỏ like
            } else {
                reply.likes.push(userId); // Thêm like
            }

            await reply.save();

            return res.status(200).json({
                message: isLiked ? "Bỏ like reply" : "Đã like reply",
                data: reply,
            });
        } catch (error) {
            console.log("Lỗi khi like/unlike reply:", error);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
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
