const mongoose = require("mongoose");
const reviewSchema = mongoose.Schema({
  images: {
    type: [String],
    default: [],
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  rate: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    required: true,
  },
  reviewDate: {
    type: Date,
    default: Date.now,
  },
});
const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  image: {
    type: [String],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  reviews: {
    type: [mongoose.Schema.ObjectId],
    ref: "Review",
  },
  color: {
    type: [String],
    required: true,
  },
  size: {
    type: [String],
    required: true,
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
  },
});

const Product = mongoose.model("Product", productSchema);
const Review = mongoose.model("Review", reviewSchema);
module.exports = { Product, Review };
