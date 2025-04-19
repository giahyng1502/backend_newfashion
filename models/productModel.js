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
  purchased : {
    type: String,
    required: true,
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
    min: 1,
    max: 5,
    default: 1,
    required: true,
  },
  orderId : {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: true,
  },
  productId : {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
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
  cost : {
    type: Number,
    required: true,
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
  color: [
    {
      imageColor : {
        type: String,
        required: true,
      },
      nameColor : {
        type: String,
        required: true,
      }
    }
  ],
  size: {
    type: [String],
    required: true,
  },
  rating :{
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  rateCount : {
    type: Number,
    min: 0,
    default: 0,
  },
  subCategory: {
    type: mongoose.Schema.ObjectId,
    ref: "Subcategory",
  },
}, {timestamps: true}
);
const featuresSchema = new mongoose.Schema({
  imageFeatures: {
    type: [
      {
        imageUrl: { type: String, required: true },
        features: { type: [Number], required: true },
      },
    ],
    required: false, // Trường này không bắt buộc khi tạo sản phẩm, có thể được cập nhật sau
  },
  productId : {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  }
})
const Product = mongoose.model("Product", productSchema);
const Features = mongoose.model("Features", featuresSchema);
const Review = mongoose.model("Review", reviewSchema);
module.exports = { Product, Review,Features };
