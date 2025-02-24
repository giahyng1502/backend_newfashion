const {Comment, Reply} = require("../models/postModel");
const replyController = {
    getReply:async  (req, res) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        const user = req.user.userId
        let skip = (page - 1) * limit; // Bỏ qua số lượng sản phẩm cần thiết
        try {
            const {commentId} = req.params;
            const comment = await Comment.findOne({_id : commentId}).populate({
                path: 'replies',
                options: { limit: limit, skip: skip },
                populate: {
                    path: 'user',
                    select: 'name avatar',
                }
            });
            const dataReturn = comment.replies.map((reply) => {
                return {
                    likeCount : reply.likes.length,
                    name : reply.user.name,
                    _id : reply._id,
                    avatar : reply.user.avatar,
                    time : reply.createdAt,
                    content : reply.content,
                    isLike: reply.likes.includes(user),
                }
            });
            return res.status(200).json({message : 'Lấy danh sách bình luận thành công',data :dataReturn});
        }catch (e) {
            console.log('error getReply'+e.message);
            return res.status(500).json({message: e.message});
        }
    },
    likeReply: async (req, res) => {
        try {
            const { replyId } = req.params;
            const userId = req.user.userId;

            // Tìm reply cần like
            const reply = await Reply.findById(replyId);
            if (!reply) {
                return res.status(404).json({ message: 'Reply không tồn tại' });
            }

            const isLiked = reply.likes.includes(userId);

            if (isLiked) {
                reply.likes = reply.likes.filter(id => id.toString() !== userId); // Bỏ like
            } else {
                reply.likes.push(userId); // Like
            }

            await reply.save();

            return res.status(200).json({
                message: isLiked ? 'Bỏ like reply' : 'Đã like reply',
                data: reply
            });
        } catch (error) {
            console.error("Lỗi khi like/unlike reply:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    replyPost: async (req, res) => {
        try {
            const user = req.user.userId;
            const { content } = req.body;
            const { commentId } = req.params;

            const newReply = new Reply({ user, content });
            await newReply.save();

            await Comment.findByIdAndUpdate(commentId, { $push: { replies: newReply._id } });

            res.status(201).json({ success: true, reply: newReply });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    deleteReply: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { replyId } = req.params;

            // Tìm reply cần xoá
            const reply = await Comment.findById(replyId);
            if (!reply) {
                return res.status(404).json({ message: "Không tìm thấy reply" });
            }

            // Kiểm tra nếu `reply.user` không tồn tại
            if (!reply.user) {
                return res.status(400).json({ message: "Reply không có thông tin user" });
            }

            // Kiểm tra quyền xoá
            if (reply.user.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền xoá reply này" });
            }

            // Xoá reply
            await Comment.findByIdAndDelete(replyId);

            // Xoá reply khỏi comment chứa nó
            await Comment.findOneAndUpdate(
                { replies: replyId },
                { $pull: { replies: replyId } }
            );

            return res.status(200).json({ success: true, message: "Xoá reply thành công" });

        } catch (error) {
            console.error("Lỗi xoá reply:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }


}

module.exports = replyController;
