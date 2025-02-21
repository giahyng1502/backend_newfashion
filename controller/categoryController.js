const {Category} = require("../models/categoryModel");
const { Product } = require("../models/productModel");
const {uploadImage} = require("../lib/cloudflare");

const categoryController = {
  // Create Category
  createCategory: async (req, res) => {
    try {
      const { categoryName } = req.body;
      const files = req.files;
      let images = [];
      console.log(files)
      if (files) {
        images = await uploadImage(files)
      }
      const imageCategory = images[0];
      const newCategory = new Category({
        categoryName,
        imageCategory
      });

      await newCategory.save();
      return res
        .status(201)
        .json({ message: "Thêm danh mục thành công", data: newCategory });
    } catch (e) {
      console.error("Lỗi khi tạo danh mục: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },

  // Get All Categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      return res
        .status(200)
        .json({
          message: "Lấy danh sách danh mục thành công",
          data: categories,
        });
    } catch (e) {
      console.error("Lỗi khi lấy danh mục: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
  // Update Category by ID
  updateCategory: async (req, res) => {
    try {
      const { categoryName, image } = req.body;

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { categoryName, image },
        { new: true } // Trả về đối tượng đã được cập nhật
      );

      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }

      return res
        .status(200)
        .json({ message: "Cập nhật danh mục thành công", data: category });
    } catch (e) {
      console.error("Lỗi khi cập nhật danh mục: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },

  // Delete Category by ID
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;

      // Kiểm tra xem có sản phẩm nào đang sử dụng danh mục này không
      const productsUsingCategory = await Product.find({
        categoryId: categoryId,
      });

      if (productsUsingCategory.length > 0) {
        return res
          .status(400)
          .json({
            message: "Không thể xóa danh mục vì có sản phẩm đang sử dụng nó.",
          });
      }

      // Xóa danh mục
      const category = await Category.findByIdAndDelete(categoryId);

      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }

      return res
        .status(200)
        .json({ message: "Xóa danh mục thành công", data: category });
    } catch (e) {
      console.error("Lỗi khi xóa danh mục: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },
};

module.exports = categoryController;
