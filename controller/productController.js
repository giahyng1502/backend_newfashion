const { Product } = require("../models/productModel");
const SaleProduct = require("../models/SaleProduct");
const productController = {
  getAll: async (req, res) => {
    try {
      const products = await Product.find();
      return res
        .status(200)
        .json({ message: "Lấy sản phẩm thành công", data: products });
    } catch (e) {
      console.error("lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
  getOne: async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await Product.findById(productId).populate({
        path: "reviews",
        populate: {
          path: "userId", // Đây là trường cần populate từ review
          select: "name avatar",
        },
      });
      return res
        .status(200)
        .json({ message: "Lấy chi tiết sản phẩm thành công", data: product });
    } catch (e) {
      console.error("lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
  addProduct: async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      return res
        .status(200)
        .json({ message: "Thêm sản phẩm thành công", data: product });
    } catch (e) {
      console.error("Thêm sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
  updateProduct: async (req, res) => {
    try {
      const productId = req.params.productId;
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        req.body,
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
      return res
        .status(200)
        .json({ message: "Sửa sản phẩm thành công", data: updatedProduct });
    } catch (e) {
      console.error("Cập nhật sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
};

module.exports = productController;
