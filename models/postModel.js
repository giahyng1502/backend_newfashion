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
    content: {
        type: String,
        required: true
    },
    replies: [
        {
            type : mongoose.Schema.ObjectId,
            ref: 'Reply',
        }
    ],
    createdAt: { type: Date, default: Date.now },
})
const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    product : {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
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
    image: {
        type: [String], // Mảng chứa URL ảnh
        default: [],
    },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],

    comments: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Comment',
        }
    ]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Reply = mongoose.model('Reply', replies);

module.exports = {Post, Comment, Reply};
