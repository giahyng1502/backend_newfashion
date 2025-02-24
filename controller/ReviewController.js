const { uploadImage } = require("../lib/cloudflare");
const { Review, Product } = require("../models/productModel");
const reviewController = {
   addReview : async (req, res) => {
    try {
      const { productId } = req.params;
      const { content, rate, images } = req.body;
      const userId = req.user.id;

      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }

      // Tạo review mới
      const newReview = new Review({
        content,
        rate,
        images,
        userId
      });

      // Lưu review vào DB
      await newReview.save();

      // Cập nhật danh sách review của sản phẩm
      product.reviews.push(newReview._id);
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

  deleteReview: async (req, res) => {
    try {
      const productId = req.params.productId;
      const { reviewId } = req.body;

      // Kiểm tra nếu không có productId hoặc reviewId
      if (!productId || !reviewId) {
        return res
          .status(400)
          .json({ message: "Thiếu productId hoặc reviewId!" });
      }

      // Xóa review khỏi database
      const review = await Review.findByIdAndDelete(reviewId);
      if (!review) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy review để xóa!" });
      }

      await Product.findByIdAndUpdate(
        productId,
        { $pull: { reviews: reviewId } },
        { new: true }
      );

      return res
        .status(200)
        .json({ message: "Xóa review thành công", data: review });
    } catch (e) {
      console.error("Xóa review sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
};

module.exports = reviewController;
