const { Review, Product } = require('../models/productModel');

const reviewController = {
    addReview: async (req, res) => {
        try {
            const productId = req.params.productId;
            const review = new Review(req.body);

            if (!productId) {
                return res.status(400).json({ message: "Thiếu productId!" });
            }

            if (!review) {
                return res.status(400).json({ message: "Dữ liệu đánh giá không hợp lệ!" });
            }

            // Lưu đánh giá vào database
            await review.save();

            // Thêm review vào danh sách `reviews` trong `Product`
            const product = await Product.findByIdAndUpdate(
                productId,
                { $push: { reviews: review._id } },
                { new: true } // Trả về dữ liệu mới sau khi cập nhật
            );

            if (!product) {
                return res.status(404).json("sản phẩm không tồn tại");
            }
            return res.status(200).json(review);
        } catch (e) {
            console.error("Thêm đánh giá thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },
     deleteReview : async (req, res) => {
        try {
            const productId = req.params.productId;
            const { reviewId } = req.body;

            // Kiểm tra nếu không có productId hoặc reviewId
            if (!productId || !reviewId) {
                return res.status(400).json({ message: "Thiếu productId hoặc reviewId!" });
            }

            // Xóa review khỏi database
            const review = await Review.findByIdAndDelete(reviewId);
            if (!review) {
                return res.status(404).json({ message: "Không tìm thấy review để xóa!" });
            }

            await Product.findByIdAndUpdate(
                productId,
                { $pull: { reviews: reviewId } },
                { new: true }
            );

            return res.status(200).json("Xóa review thành công");

        } catch (e) {
            console.error("Xóa review sản phẩm thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    }
};

module.exports = reviewController;
