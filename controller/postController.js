const Post = require('../models/postModel');
const User = require('../models/userModel');

const postController = {
    // 1. Tạo bài viết
    createPost: async (req, res) => {
        try {
            const { content, image } = req.body;
            const userId = req.user.userId;

            if (!content) {
                return res.status(400).json({ message: 'Nội dung bài viết không được để trống' });
            }

            const newPost = new Post({
                userId,
                content,
                image: image || [],
            });

            await newPost.save();
            return res.status(201).json({ message: 'Tạo bài viết thành công', data : newPost });
        } catch (error) {
            console.error("Lỗi khi tạo bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 2. Lấy danh sách bài viết
    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.find();
            return res.status(200).json({ message: 'Lấy danh sách bài viết thành công', data : posts });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 3. Chỉnh sửa bài viết
    updatePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { content, image } = req.body;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }
            //if (post.userId.toString() !== userId) {
            //    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài viết này' });
            //}

            post.content = content || post.content;
            post.image = image || post.image;
            await post.save();

            return res.status(200).json({ message: 'Cập nhật bài viết thành công', data : post });
        } catch (error) {
            console.error("Lỗi khi cập nhật bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 4. Xóa bài viết
    deletePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }
            //if (post.userId.toString() !== userId) {
                //return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
            //}

            await post.deleteOne();
            return res.status(200).json({ message: 'Xóa bài viết thành công' });
        } catch (error) {
            console.error("Lỗi khi xóa bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 5. Like / Unlike bài viết
    toggleLikePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }

            const isLiked = post.likes.includes(userId);
            if (isLiked) {
                post.likes = post.likes.filter(id => id.toString() !== userId);
            } else {
                post.likes.push(userId);
            }

            await post.save();
            return res.status(200).json({ message: isLiked ? 'Bỏ like bài viết' : 'Đã like bài viết', data : post });
        } catch (error) {
            console.error("Lỗi khi like/unlike bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 6. Bình luận bài viết
    commentPost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { comment } = req.body;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }

            const newComment = { userId, comment, createdAt: new Date() };
            post.comments.push(newComment);
            await post.save();

            return res.status(200).json({ message: 'Bình luận thành công', data : post });
        } catch (error) {
            console.error("Lỗi khi bình luận bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    getPostDetail: async (req, res) => {
        try{
            const { postId } = req.params;
            const post = await Post.findById(postId).populate('comments.userId',"name avatar").sort({createdAt : -1});
            if (!post) {
                return res.status(404).json({message : 'Bài đăng này không tồn tại'});
            }
            return res.status(404).json({message : 'Lấy chi tiết bài viết thành công',data : post});
        }catch (e) {
            console.error("Lỗi khi bình luận bài viết:", e);
            return res.status(500).json({ message: 'Lỗi server', error: e.message });
        }

    }
};

module.exports = postController;
