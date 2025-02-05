const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: [String], // Mảng chứa URL ảnh
        default: [],
    },
    likes: {
        type: [mongoose.Schema.ObjectId], // Mảng chứa ID người đã like
        ref: 'User',
        default: [],
    },
    comments: [
        {
            userId:
                {
                type: mongoose.Schema.ObjectId,
                ref: 'User', required: true
            },
            comment:
                { type: String,
                    required: true },
            createdAt: { type: Date, default: Date.now },
        }
    ]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
