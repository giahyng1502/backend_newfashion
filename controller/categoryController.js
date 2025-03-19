const {Category, SubCategory} = require("../models/categoryModel");
const { Product } = require("../models/productModel");
const {uploadImage} = require("../lib/cloudflare");

const categoryController = {
  // Create Category
  createCategory: async (req, res) => {
    try {
      const {categoryName} = req.body;
      const files = req.files;
      let images = [];
      if (files && files.length > 0) {
        images = await uploadImage(files);
      }
      const imageCategory = images[0];
      const newCategory = new Category({
        categoryName,
        imageCategory
      });

      await newCategory.save();
      return res
          .status(201)
          .json({message: "Thêm danh mục thành công", data: newCategory});
    } catch (e) {
      console.error("Lỗi khi tạo danh mục: " + e.message);
      return res.status(500).json({message: "Lỗi server", error: e.message});
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
      console.error("Lỗi khi lấy danh mục : " + e.message);
      return res.status(500).json({message: "Lỗi server", error: e.message});
    }
  },
  // Update Category by ID
  updateCategory: async (req, res) => {
    try {
      const {categoryName, image} = req.body;

      const category = await Category.findByIdAndUpdate(
          req.params.id,
          {categoryName, image},
          {new: true} // Trả về đối tượng đã được cập nhật
      );

      if (!category) {
        return res.status(404).json({message: "Danh mục không tồn tại"});
      }

      return res
          .status(200)
          .json({message: "Cập nhật danh mục thành công", data: category});
    } catch (e) {
      console.error("Lỗi khi cập nhật danh mục: " + e.message);
      return res.status(500).json({message: "Lỗi server", error: e.message});
    }
  },

  // Delete Category by ID
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;

      // Tìm danh mục
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({message: "Danh mục không tồn tại"});
      }

      // Kiểm tra nếu danh mục có danh mục con
      if (category.subCategory && category.subCategory.length > 0) {
        return res
            .status(400)
            .json({message: "Không thể xóa danh mục này vì vẫn tồn tại danh mục phụ thuộc"});
      }

      // Xóa danh mục
      await category.deleteOne();

      return res.status(200).json({message: "Xóa danh mục thành công"});
    } catch (e) {
      console.error("Lỗi khi xóa danh mục:", e);
      return res.status(500).json({message: "Lỗi server", error: e.message});
    }
  },
  getProductCategories: async (req, res) => {
    try {
      const id = req.params.id;

      // Tìm danh mục theo ID
      let category = await Category.findOne({ _id: id });

      // Kiểm tra nếu danh mục không tồn tại
      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }

      // Lấy danh sách subCategory (tối đa 10 danh mục con)
      const subCategories = category.subCategory || []

      // Tìm tất cả sản phẩm thuộc các subCategory này
      let products = await Product.find({ subCategory: { $in: subCategories } })
          .limit(10) // Chỉ lấy tổng cộng 10 sản phẩm
          .exec();

      return res.status(200).json({
        message: 'Lấy dữ liệu thành công',
        data: products,
      });
    } catch (e) {
      console.error("Lỗi khi lấy danh mục và sản phẩm:", e);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  }


}


module.exports = categoryController;
