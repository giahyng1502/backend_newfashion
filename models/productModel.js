const mongoose = require("mongoose");
//  Chất liệu: Polyester
// Thành phần: 100% Polyester
// Chiều dài tay áo: Dài tay
// Họa tiết: Họa tiết hình học
// Đối tượng sử dụng: Người lớn
// Độ xuyên thấu: Không
// Loại: Áo khoác
// Mùa: Thu/Đông
// Hướng dẫn sử dụng: Giặt máy, không giặt khô
// Phong cách: Thời trang thường ngày
// Độ co giãn của vải: Co giãn nhẹ
// Phương pháp dệt: Dệt thoi
// Xuất xứ: Hồ Bắc, Trung Quốc


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
const descriptionSchema = new mongoose.Schema({
  material: { type: String }, // Chất liệu
  composition: { type: String }, // Thành phần
  sleeveLength: { type: String }, // Chiều dài tay áo
  pattern: { type: String }, // Họa tiết
  applicablePeople: { type: String }, // Đối tượng sử dụng
  sheer: { type: Boolean }, // Độ xuyên thấu
  type: { type: String }, // Loại sản phẩm
  season: { type: [String] }, // Mùa phù hợp (VD: ['Fall', 'Winter'])
  operationInstruction: { type: String }, // Hướng dẫn sử dụng
  style: { type: String }, // Phong cách
  fabricElasticity: { type: String }, // Độ co giãn
  weavingMethod: { type: String }, // Phương pháp dệt
  origin: { type: String }, // Xuất xứ
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sold: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  stock : {
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
    type: descriptionSchema, // Sử dụng subdocument schema đã định nghĩa
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
  subCategory: {
    type: mongoose.Schema.ObjectId,
    ref: "Subcategory",
  },
});

const Product = mongoose.model("Product", productSchema);
const Review = mongoose.model("Review", reviewSchema);
module.exports = { Product, Review };
