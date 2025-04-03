const { uploadImage } = require("../lib/cloudflare");
const { Review, Product } = require("../models/productModel");
const Order = require("../models/orderModel");
const reviewController = {
  addReview: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { content, productId } = req.body;
      const rate = parseInt(req.body.rate);
      const userId = req.user.userId;
      const files = req.files;
      let images;
      console.log(userId);
      // 🔎 Kiểm tra đơn hàng hợp lệ và thuộc về người dùng
      const order = await Order.findOne({ $and : [{_id: orderId} , {userId : userId}] });

      if (!order) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại hoặc không thuộc về bạn" });
      }
      // 🚛 Chỉ cho phép đánh giá nếu đơn hàng đã giao thành công
      if (order.status !== 3) {
        return res.status(400).json({ message: "Bạn chỉ có thể đánh giá khi đơn hàng đã giao thành công" });
      }

      // 🛍️ Kiểm tra sản phẩm có trong đơn hàng không
      const itemInOrder = order.items.find((item) => item.productId.toString() === productId);
      if (!itemInOrder) {
        return res.status(400).json({ message: "Sản phẩm không nằm trong đơn hàng này" });
      }

      //  Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
      const existingReview = await Review.findOne({ productId: productId, userId, orderId });
      if (existingReview) {
        return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi!" });
      }

      // 🏷️Kiểm tra sản phẩm có tồn tại không
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }

      //  Lấy thông tin màu sắc & kích thước đã mua
      const purchased = `Màu: ${itemInOrder.color?.nameColor || "Không xác định"} / Kích thước: ${itemInOrder.size}`;
      if (files.length > 0) {
        images = await uploadImage(files);
      }
      // ✍️ Tạo review mới
      const newReview = new Review({
        content,
        rate,
        purchased,
        productId,
        orderId,
        images,
        userId,
      });
      //  Lưu review vào DB
      await newReview.save();

      //  Tối ưu cập nhật rating trung bình
      product.rateCount += 1;
      product.totalRating = (product.totalRating || 0) + rate;
      product.rating = parseFloat((product.totalRating / product.rateCount).toFixed(1));

      // Lưu cập nhật vào DB
      await product.save();
      console.log(newReview)
      const newOrder = await Order.findOneAndUpdate(
          { _id: orderId, "items.productId": productId },
          { $set: { "items.$.reviewId": newReview._id } },
          { new: true }
      );
      console.log(order)
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
