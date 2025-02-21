const { Product } = require("../models/productModel");
const {uploadImage} = require("../lib/cloudflare");
const {SubCategory} = require("../models/categoryModel");
const productController = {
  getAll: async (req, res) => {
    try {
      const products = await Product.find({});
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
   addProduct : async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Không có file nào được chọn" });
      }

      let { name, price, description,sold, size, color, subCategory } = req.body;

      if (!name || !price || !description || !size || !color || !subCategory || !sold) {
        return res.status(400).json({ error: "Không được bỏ trống các trường" });
      }
      const subCate = await SubCategory.findById(subCategory)
      if (!subCate) {
        return res.status(400).json({message : 'subCategory không tồn tại'})
      }
      // Chuyển đổi từ chuỗi JSON sang Object / Array
      try {
        description = JSON.parse(description);
        size = JSON.parse(size);
        color = JSON.parse(color);
      } catch (error) {
        return res.status(400).json({ error: "Dữ liệu không đúng định dạng JSON" });
      }

      if (!Array.isArray(size) || !Array.isArray(color)) {
        return res.status(400).json({ error: "Size và Color phải là mảng" });
      }

      if (typeof description !== "object") {
        return res.status(400).json({ error: "Mô tả sản phẩm phải là một object" });
      }

      // Upload hình ảnh
      const imageUrls = await uploadImage(req.files);

      // Tạo sản phẩm mới
      const newProduct = new Product({
        name,
        price,
        subCategory,
        size,
        image: imageUrls,
        color,
        sold,
        description,
      });

      // Lưu vào database
      await newProduct.save();

      return res.status(200).json({ message: "Thêm sản phẩm thành công", product: newProduct });
    } catch (e) {
      console.error("Thêm sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },


   updateProduct : async (req, res) => {
    try {
      const id = req.params.productId;
      let { name, price, description, size, color, subCategory, sold } = req.body;
      const updateFields = {}; // Chứa các trường cần update

      if (subCategory) {
        const subCate = await SubCategory.findById(subCategory);
        if (!subCate) {
          return res.status(400).json({ message: "Subcategory không tồn tại" });
        }
        updateFields.subCategory = subCategory;
      }

      // Chỉ parse JSON nếu dữ liệu tồn tại
      try {
        if (description) updateFields.description = JSON.parse(description);
        if (size) updateFields.size = JSON.parse(size);
        if (color) updateFields.color = JSON.parse(color);
      } catch (error) {
        return res.status(400).json({ error: "Dữ liệu không đúng định dạng JSON" });
      }

      // Ép kiểu `sold` sang số nếu tồn tại
      if (sold !== undefined) {
        updateFields.sold = Number(sold);
      }

      // Upload hình ảnh nếu có
      if (req.files && req.files.length > 0) {
        updateFields.image = await uploadImage(req.files);
      }

      // Chỉ cập nhật nếu trường đó tồn tại
      if (name) updateFields.name = name;
      if (price) updateFields.price = price;

      // Cập nhật sản phẩm
      const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

      if (!updatedProduct) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }

      console.log("Sản phẩm sau khi cập nhật:", updateFields);

      return res.status(200).json({ message: "Cập nhật sản phẩm thành công", product: updatedProduct });
    } catch (e) {
      console.error("Cập nhật sản phẩm thất bại:", e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  }


};

module.exports = productController;
