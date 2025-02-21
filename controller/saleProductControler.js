const SaleProduct = require("../models/SaleProduct");
const {Product} = require("../models/productModel");

const saleProductController = {
    // Thêm sản phẩm giảm giá
    addSaleProduct: async (req, res) => {
        try {
            const { productId, discount, expireAt,limit } = req.body;

            // Kiểm tra xem sản phẩm có tồn tại không
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            }

            // Kiểm tra nếu sản phẩm đã có giảm giá
            const existingSaleProduct = await SaleProduct.findOne({ productId });
            if (existingSaleProduct) {
                return res.status(400).json({ message: "Sản phẩm đã có giảm giá" });
            }

            // Thêm sản phẩm vào SaleProduct
            const remainDate = new Date(Date.now() + expireAt * 60 * 60 * 1000)
            const saleProduct = new SaleProduct({
                productId,
                discount,
                limit,
                expireAt : remainDate,
            });

            await saleProduct.save();
            return res.status(201).json({ message: "Thêm giảm giá thành công", data: saleProduct });
        } catch (error) {
            console.error("Lỗi khi thêm sản phẩm giảm giá: " + error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Cập nhật sản phẩm giảm giá
    updateSaleProduct: async (req, res) => {
        try {
            const saleProductId = req.params.saleProductId;
            const { discount, expireAt,limit } = req.body;

            const saleProduct = await SaleProduct.findById(saleProductId);
            if (!saleProduct) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm giảm giá" });
            }

            // Cập nhật thông tin giảm giá
            const remainDate = new Date(Date.now() + expireAt * 60 * 60 * 1000)

            if (discount !== undefined) saleProduct.discount = discount;
            if (expireAt !== undefined) saleProduct.expireAt = remainDate;
            if (limit !== undefined) saleProduct.limit = limit;

            await saleProduct.save();
            return res.status(200).json({ message: "Cập nhật giảm giá thành công", data: saleProduct });
        } catch (error) {
            console.error("Lỗi khi cập nhật sản phẩm giảm giá: " + error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Xóa giảm giá cho sản phẩm
    deleteSaleProduct: async (req, res) => {
        try {
            const saleProductId = req.params.saleProductId;
            const saleProduct = await SaleProduct.findById(saleProductId);

            if (!saleProduct) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm giảm giá" });
            }

            await saleProduct.deleteOne();
            return res.status(200).json({ message: "Xóa giảm giá thành công" });
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm giảm giá: " + error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Lấy tất cả sản phẩm giảm giá
    getAllSaleProducts: async (req, res) => {
        try {
            const saleProducts = await SaleProduct.find().populate('productId');
            return res.status(200).json({ message: "Lấy danh sách sản phẩm giảm giá thành công", data: saleProducts });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách sản phẩm giảm giá: " + error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Lấy sản phẩm giảm giá theo ID
    getSaleProductById: async (req, res) => {
        try {
            const saleProductId = req.params.saleProductId;
            const saleProduct = await SaleProduct.findById(saleProductId).populate('productId');
            if (!saleProduct) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm giảm giá" });
            }
            return res.status(200).json({ message: "Lấy sản phẩm giảm giá thành công", data: saleProduct });
        } catch (error) {
            console.error("Lỗi khi lấy sản phẩm giảm giá: " + error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
};

module.exports = saleProductController;
