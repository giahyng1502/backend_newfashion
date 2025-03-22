const {Post,Comment, Reply} = require('../models/postModel');
const User = require('../models/userModel');
const {uploadImage} = require("../lib/cloudflare");

const postController = {
    // 1. Tạo bài viết
    createPost: async (req, res) => {
        try {
            const { content,hashtag} = req.body;
            const files = req.files;
            const user = req.user.userId;

            let image = [];
            if (files && files.length) {
                image = await uploadImage(files);
            }
            if (!content) {
                return res.status(400).json({ message: 'Nội dung bài viết không được để trống' });
            }

            const newPost = new Post({
                user,
                content,
                image: image,
                hashtag : hashtag,
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
            const userId = req.user.userId;
            const posts = await Post.find({})
                .populate("user", "name avatar")
            // Duyệt qua từng bài post và thêm `isLike`
            const data = posts.map((post) => ({
                ...post.toObject(), // Chuyển document Mongoose thành object thuần
                isLike: post.likes.includes(userId), // So sánh với `userId`
            }));

            return res.status(200).json({ message: 'Lấy danh sách bài viết thành công', data });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },


    // 3. Chỉnh sửa bài viết
    updatePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const { content ,hashtag} = req.body;
            const files = req.files;

            let image;
            if (files && files.length) {
                image = await uploadImage(files);
            }
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }
            post.content = content || post.content;
            post.image = image || post.image;
            post.hashtag = hashtag || post.hashtag;
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
            const user = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }

            const isLiked = post.likes.includes(user);
            if (isLiked) {
                post.likes = post.likes.filter(id => id.toString() !== user);
            } else {
                post.likes.push(user);
            }

            await post.save();
            return res.status(200).json({ message: isLiked ? 'Bỏ like bài viết' : 'Đã like bài viết', data : post });
        } catch (error) {
            console.error("Lỗi khi like/unlike bài viết:", error);
            return res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 6. Bình luận bài viết

    getPostDetails: async (req, res) => {
        try {
            const postId = req.params.postId;
            const userId = req.user.id;

            const post = await Post.findById(postId)
                .populate("user", "name avatar") // ✅ Lấy thông tin user
                .populate({
                    path: "comments",
                    options: {limit : 10},
                    populate: {
                        path: "user",
                        select: "name avatar",
                        match: { _id: { $ne: null } }, // ✅ Chỉ lấy comment có userId hợp lệ
                    },
                })

            if (!post) {
                return res.status(404).json({ message: "Bài viết không tồn tại" });
            }


            // Xử lý dữ liệu trả về
            const formattedPost = {
                shopName: post.user ? post.user.name : "Unknown Shop", // ✅ Kiểm tra null
                shopAvatar: post.user ? post.user.avatar : "",
                time: post.createdAt,
                imageUrl: post.image,
                content: post.content,
                likeCount: post.likes.length,
                isLike: post.likes.includes(userId),
                commentCount: post.comments.length,
            };

            const formattedComments = post.comments.map((comment) => ({
                likeCount: comment.likes.length,
                commentCount: comment.replies.length,
                isLike: comment.likes.includes(userId),
                name: comment.user ? comment.user.name : "Unknown User",
                content: comment.content,
                time: comment.createdAt,
                avatar: comment.user ? comment.user.avatar : null,
                replyCount : comment.replies.length,
            }));

            return res.status(200).json({ post: formattedPost, comments: formattedComments });
        } catch (error) {
            console.error("Lỗi lấy bài viết:", error);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    searchPostByHashtag: async (req, res) => {
        try {
            const hashtag = req.query.hashtag;
            const posts = await Post.find({
                hashtag : {$regex : hashtag,$options : 'i'},
            })
            if (posts.length === 0) {
                return res.status(404).json({message : 'Không tìm thấy bài viết nào tồn tại'})
            }
            return res.status(200).json({ posts: posts });
        }catch (e) {
            console.log(e)
            return res.status(500).json({message : 'Lỗi server : ',error: e});
        }
    }

};

module.exports = postController;
