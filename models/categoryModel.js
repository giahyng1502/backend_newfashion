const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String, 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
