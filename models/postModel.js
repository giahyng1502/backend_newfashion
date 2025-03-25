const mongoose = require('mongoose');

const replies = new mongoose.Schema({
    user:
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User', required: true
        },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],
    commentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Comment', required: true,
    },
    content: {
        type: String,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
})

const commentSchema = new mongoose.Schema({
    user:
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User', required: true
        },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],
    replyCount: {
        type: Number,
        default : 0
    },
    content: {
        type: String,
        required: true
    },
    postId: {
            type : mongoose.Schema.ObjectId,
            ref: 'Post',
            required: true,
    },
    createdAt: { type: Date, default: Date.now },
})
const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    hashtag : {
      type: String,
      required: true,
    },
    images: {
        type: [String], // Mảng chứa URL ảnh
        default: [],
    },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],

    commentCount: {
            type: Number,
            default : 0
    }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Reply = mongoose.model('Reply', replies);

module.exports = {Post, Comment, Reply};
