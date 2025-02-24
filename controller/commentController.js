const {Comment, Post, Reply} = require("../models/postModel");
const commentController = {
    getComment:async  (req, res) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit; // Bỏ qua số lượng sản phẩm cần thiết
        const user = req.user.userId
        try {
            const {postId} = req.params;
            const post = await Post.findOne({_id : postId}).populate({
                path: 'comments',
                options: { limit: 10, skip: skip },
                populate: {
                    path: 'user',
                    select: 'name avatar',
                }
            });
            const dataReturn = post.comments.map((comment) => {
                return {
                    _id : comment._id,
                    likeCount : comment.likes.length,
                    replyCount : comment.replies.length,
                    name : comment.user.name,
                    avatar : comment.user.avatar,
                    content : comment.content,
                    time : comment.createdAt,
                    isLike: comment.likes.includes(user),
                }
            });
            return res.status(200).json({message : 'Lấy danh sách bình luận thành công',data :dataReturn});
        }catch (e) {
            console.log('error getReply'+e.message);
            return res.status(500).json({message: e.message});
        }
    },
    commentPost: async (req, res) => {
        try {
            const user = req.user.userId
            const { content } = req.body;
            const { postId } = req.params;

            const newComment = new Comment({ user, content });
            await newComment.save();

            await Post.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });

            res.status(201).json({ success: true, comment: newComment });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    deleteComment: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { commentId } = req.params;

            // Tìm comment cần xoá và populate user
            const comment = await Comment.findById(commentId).populate("user replies");

            if (!comment) {
                return res.status(404).json({ message: "Không tìm thấy comment" });
            }

            // Kiểm tra nếu comment.user bị undefined
            if (!comment.user) {
                return res.status(400).json({ message: "Comment không có thông tin user" });
            }

            // Kiểm tra quyền xoá
            if (comment.user._id.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền xoá comment này" });
            }

            // Xoá toàn bộ reply của comment
            await Reply.deleteMany({ _id: { $in: comment.replies } });

            // Xoá comment chính
            await Comment.findByIdAndDelete(commentId);

            // Xoá comment khỏi danh sách của bài viết
            await Post.findOneAndUpdate(
                { comments: commentId },
                { $pull: { comments: commentId } }
            );

            return res.status(200).json({ success: true, message: "Xoá comment và các reply thành công" });

        } catch (error) {
            console.error("Lỗi xoá comment:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },


    likeComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }

            const isLiked = comment.likes.includes(userId);
            if (isLiked) {
                comment.likes = comment.likes.filter(id => id.toString() !== userId);
            } else {
                comment.likes.push(userId);
            }

            await comment.save();
            return res.status(200).json({ message: isLiked ? 'Bỏ like bài viết' : 'Đã like bài viết', data : comment });
        } catch (error) {
            console.error("Lỗi khi like/unlike bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
}
module.exports = commentController;