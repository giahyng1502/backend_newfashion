const { uploadImage } = require("../lib/cloudflare");
const { Review, Product } = require("../models/productModel");
const reviewController = {
   addReview : async (req, res) => {
    try {
      const { productId } = req.params;
      const { content, rate } = req.body;
      const userId = req.user.userId;
      const files = req.files
      let images;
      if (files.length > 0) {
        images = await uploadImage(files)
      }
      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }

      // Tạo review mới
      const newReview = new Review({
        content,
        rate,
        product : productId,
        images,
        userId
      });

      // Lưu review vào DB
      await newReview.save();

      // Cập nhật danh sách review của sản phẩm
      product.rateCount += 1;

      // Tính lại rating trung bình
      const allReviews = await Review.find({ _id: { $in: product.reviews } });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rate, 0);
      product.rating = totalRating / product.rateCount;

      // Lưu cập nhật sản phẩm
      await product.save();

      return res.status(201).json({ message: "Đánh giá thành công", review: newReview });

    } catch (error) {
      console.error("Lỗi thêm review:", error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
  getReviewByProductId: async (req, res) => {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit) || 5;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      // Đếm tổng số review cho sản phẩm
      const totalReviews = await Review.countDocuments({ product: productId });

      // Lấy danh sách review có phân trang và sắp xếp mới nhất trước
      const reviews = await Review.find({ product: productId })
          .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo thời gian
          .skip(skip)
          .limit(limit).populate("userId",'name avatar');

      return res.status(200).json({
        message: "Lấy review thành công",
        data: reviews,
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviews,
      });

    } catch (error) {
      console.error("Lỗi khi lấy review:", error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.body;
      const userId = req.user.userId;

      // Kiểm tra thiếu dữ liệu
      if (!reviewId) {
        return res.status(400).json({ message: "Thiếu reviewId!" });
      }

      // Tìm review trước để kiểm tra quyền xóa
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Không tìm thấy review!" });
      }

      // Kiểm tra quyền xóa (chỉ cho phép người tạo review xóa)
      if (review.userId.toString() !== userId ) {
        return res.status(400).json({ message: "Bạn không có quyền xóa review này!" });
      }

      // Thực hiện xóa review
      await Review.deleteOne({ _id: reviewId });

      return res.status(200).json({ message: "Xóa review thành công", data: review });
    } catch (e) {
      console.error("Xóa review sản phẩm thất bại:", e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  }
};

module.exports = reviewController;
