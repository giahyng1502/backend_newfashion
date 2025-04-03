const { Product, Review} = require("../models/productModel");
const {uploadImage} = require("../lib/cloudflare");
const {SubCategory} = require("../models/categoryModel");
const SaleProduct = require("../models/SaleProduct");
const {Types} = require("mongoose");
const productController = {
  getProductNotInSale: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      // Lấy danh sách productId
      const saleProductIds = await SaleProduct.distinct("productId");

      // Tìm tổng số sản phẩm không thuộc SaleProduct
      const totalProducts = await Product.countDocuments({ _id: { $nin: saleProductIds } });

      // Lấy danh sách sản phẩm (có phân trang) nhưng không chứa sản phẩm đã sale
      const products = await Product.find({ _id: { $nin: saleProductIds } })
          .skip(skip)
          .limit(limit);

      return res.status(200).json({
        message: "Lấy sản phẩm thành công",
        data: products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts
      });

    } catch (e) {
      console.error("Lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },

  getAllProduct: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;
      const totalProducts = await Product.countDocuments();

      // Lấy danh sách sản phẩm (có phân trang) nhưng không chứa sản phẩm đã sale
      const products = await Product.find()
          .skip(skip)
          .sort({
            createdAt: -1
          })
          .limit(limit);

      return res.status(200).json({
        message: "Lấy sản phẩm thành công",
        data: products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts
      });

    } catch (e) {
      console.error("Lấy dữ liệu sản phẩm thất bại: " + e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },


  getOne: async (req, res) => {
    try {
      const productId = req.params.productId;

      // Lấy sản phẩm theo ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      // **Tính tổng số review** (chỉ đếm, không lấy dữ liệu)
      const totalReviews = await Review.countDocuments({ productId: productId });

      const starCountsResult = await Review.aggregate([
        { $match: { productId: new Types.ObjectId(productId) } },
        { $group: { _id: "$rate", count: { $sum: 1 } } }
      ]);
      console.log(starCountsResult)
// Chuyển kết quả về dạng object chuẩn
      const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      starCountsResult.forEach(({ _id, count }) => {
        if (_id >= 1 && _id <= 5) {
          starCounts[_id] = count;
        }
      });



      // **Chỉ lấy 5 review gần nhất** (tối ưu bằng `limit` + `sort`)
      const latestReviews = await Review.find({ productId: productId })
          .populate("userId", "name avatar")
          .sort({ createdAt: -1 }) // Lấy review mới nhất trước
          .limit(5);
      // Lấy thông tin giảm giá (nếu có)
      const saleProduct = await SaleProduct.findOne({ productId });

      let responseData = {
        message: "Lấy chi tiết sản phẩm thành công",
        data: product,
        totalReviews,
        starCounts,
        reviews: latestReviews,
      };

      if (saleProduct) {
        responseData.discount = saleProduct.discount;
        responseData.limit = saleProduct.limit;
        responseData.expireAt = saleProduct.expireAt;
      }

      return res.status(200).json(responseData);
    } catch (e) {
      console.error("Lỗi lấy dữ liệu sản phẩm:", e.message);
      return res.status(500).json({ message: "Lỗi server", error: e.message });
    }
  },


  addProduct : async (req, res) => {
    try {
      let { name, price, description, size, color ,cost, subCategory,stock,image } = req.body;

      if (!name || !price || !description || !size || !color || !subCategory || !stock || !cost ||!image) {
        console.log(req.body)
        return res.status(400).json({ error: "Không được bỏ trống các trường" });
      }
      const subCate = await SubCategory.findById(subCategory)
      if (!subCate) {
        return res.status(400).json({message : 'subCategory không tồn tại'})
      }
      const newSize = size.split(',')
      const newProduct = new Product({
        name,
        price,
        subCategory,
        size : newSize,
        image,
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
        let { name, price, description, size, color, subCategory, stock ,cost,image} = req.body;
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
      } catch (error) {
        return res.status(400).json({ error: "Dữ liệu không đúng định dạng JSON" });
      }

      // Ép kiểu `sold` sang số nếu tồn tại
      if (stock !== undefined) {
        updateFields.stock = Number(stock);
      }
      if (cost !== undefined) {
        updateFields.cost = Number(cost);
      }

      // Upload hình ảnh nếu có
      if (color) {
        updateFields.color = color;
      }
      if (image) {
        if (image.length > 0) {
          updateFields.image = image;
        }
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
  },
  searchProducts: async (req, res) => {
    try {
      let {
        page = 1,
        limit = 10,
        sortField = "createdAt",
        sortOrder = "desc",
        search,
        minPrice,
        maxPrice
      } = req.query;

      // Đảm bảo `page` và `limit` là số nguyên dương
      page = Math.max(1, parseInt(page)) || 1;
      limit = Math.max(1, parseInt(limit)) || 10;

      // Tạo bộ lọc tìm kiếm
      const filter = {};

      if (search && search.trim() !== "") {
        if (search.match(/^[0-9a-fA-F]{24}$/)) {
          // Nếu search là ObjectId, tìm theo ID
          filter._id = search;
        } else {
          // Tìm theo tên sản phẩm
          filter.name = { $regex: search, $options: "i" };
        }
      }

      // Lọc theo khoảng giá
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      // Tạo bộ sắp xếp
      const sortOption = {};
      sortOption[sortField] = sortOrder === "desc" ? -1 : 1;

      // Đếm tổng số sản phẩm phù hợp trước khi phân trang
      const totalProducts = await Product.countDocuments(filter);

      // Nếu page vượt quá số lượng sản phẩm có sẵn, điều chỉnh về trang cuối cùng
      const totalPages = Math.ceil(totalProducts / limit);
      if (page > totalPages) page = totalPages || 1;

      // Lấy danh sách sản phẩm theo điều kiện lọc, sắp xếp và phân trang
      const products = await Product.find(filter)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();

      res.status(200).json({
        data: products,
        total: totalProducts,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  getProductBySubCategory : async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const subcateId = req.params.subCategory || null;
        if (!subcateId) {
          return res.status(404).json({message : 'Vui lòng chọn subcategory cần tìm'})
        }
        const totalProductInCategory = await Product.countDocuments({subCategory: subcateId});
        const product = await Product.find({subCategory: subcateId}).skip(skip).limit(limit);
        return res.status(200).json({message: 'Lấy danh sách sản phẩm trong subcategory thành công',data : product,
          totalProductInCategory: totalProductInCategory,
          currentPage : page,
          totalPage : Math.ceil(totalProductInCategory/limit),
        });
    }catch (e) {
      console.log(e)
      return res.status(500).json({message: 'Lỗi hệ thống',error: e});
    }
  }
};

module.exports = productController;
