const { Product, Review} = require("../models/productModel");
const {uploadImage} = require("../lib/cloudflare");
const {SubCategory} = require("../models/categoryModel");
const SaleProduct = require("../models/SaleProduct");
const productController = {
  getAll: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit; // Bỏ qua số lượng sản phẩm cần thiết

      // Tìm tổng số sản phẩm
      const totalProducts = await Product.countDocuments();

      // Lấy danh sách sản phẩm có phân trang
      const products = await Product.find({})
          .skip(skip)
          .limit(limit);

      return res.status(200).json({
        message: "Lấy sản phẩm thành công",
        data: products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts
      });

    } catch (e) {
      console.error("Lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const productId = req.params.productId;
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 5;
      let skip = (page - 1) * limit;

      const product = await Product.findById(productId)
          .populate({
            path: "reviews",
            options: { limit: limit, skip: skip }, // Áp dụng phân trang cho review
            populate: {
              path: "userId",
              select: "name avatar",
            },
          });

      // Tính tổng số review để biết tổng số trang
      const totalReviews = await Review.countDocuments({ productId });
      const totalPages = Math.ceil(totalReviews / limit);

      const saleProduct = await SaleProduct.findOne({productId: productId});
      if (saleProduct) {
        return res.status(200).json({
          message: "Lấy chi tiết sản phẩm thành công",
          data: product,
          discount : saleProduct.discount,
          limit : saleProduct.limit,
          expireAt : saleProduct.expireAt,
          totalPages: totalPages,
          currentPage: page,
        });
      }
      return res.status(200).json({
        message: "Lấy chi tiết sản phẩm thành công",
        data: product,
        totalPages: totalPages,
        currentPage: page,
      });
    } catch (e) {
      console.error("Lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }

  },
   addProduct : async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Không có file nào được chọn" });
      }

      let { name, price, description, size, color , subCategory,stock } = req.body;

      if (!name || !price || !description || !size || !color || !subCategory || !stock) {
        return res.status(400).json({ error: "Không được bỏ trống các trường" });
      }
      const subCate = await SubCategory.findById(subCategory)
      if (!subCate) {
        return res.status(400).json({message : 'subCategory không tồn tại'})
      }

      const imageUrls = await uploadImage(req.files);

      const newProduct = new Product({
        name,
        price,
        subCategory,
        size,
        image: imageUrls,
        color,
        stock,
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
      let { name, price, description, size, color, subCategory, stock } = req.body;
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
      if (stock !== undefined) {
        updateFields.stock = Number(stock);
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
