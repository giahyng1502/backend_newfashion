const { User } = require("../models/userModel");
const { Product } = require("../models/productModel");
const Cart = require("../models/cartModel");
const {log} = require("debug");

const cartController = {
    // Lấy giỏ hàng của user
    getCart: async (req, res) => {
        try {
            const userId = req.user._id;
            let cart = await Cart.findOne({ userId }).populate("products.productId");

            if (!cart) {
                cart = new Cart({ userId, products: [], totalPrice: 0 });
                await cart.save();
            }

            return res.json({message : 'Lấy dữ liệu trong giỏ hàng thành công ', data : cart});
        } catch (e) {
            console.error("Lấy giỏ hàng thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (req, res) => {
        try {
            const userId = req.user._id;
            const { productId, quantity } = req.body;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, products: [], totalPrice: 0 });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            }

            // Tìm sản phẩm trong giỏ hàng
            const index = cart.products.findIndex(p => p.productId.equals(productId));

            if (index === -1) {
                // Nếu chưa có sản phẩm, thêm mới
                cart.products.push({ productId, quantity });
            } else {
                // Nếu đã có, tăng số lượng
                cart.products[index].quantity += quantity;
            }

            // Cập nhật tổng tiền
            cart.total = await calculateTotalPrice(cart.products);
            log(cart.total)
            await cart.save();
            return res.status(200).json({ message: "Thêm vào giỏ hàng thành công", cart });
        } catch (e) {
            console.error("Thêm vào giỏ hàng thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },

    //  Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCart: async (req, res) => {
        try {
            const userId = req.user._id;
            const productId = req.body.productId;
            const quantity = req.body.quantity;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            const index = cart.products.findIndex(p => p.productId.equals(productId));
            if (index === -1) {
                return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
            }

            // Cập nhật số lượng sản phẩm
            cart.products[index].quantity = Number(quantity);

            // Cập nhật tổng tiền
            cart.total = await calculateTotalPrice(cart.products);

            await cart.save();
            return res.status(200).json({ message: "Cập nhật giỏ hàng thành công", cart });
        } catch (e) {
            console.error("Cập nhật giỏ hàng thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (req, res) => {
        try {
            const userId = req.user._id;
            const { productId } = req.body;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            // Lọc bỏ sản phẩm cần xóa
            cart.products = cart.products.filter(p => !p.productId.equals(productId));

            // Cập nhật tổng tiền
            cart.total = await calculateTotalPrice(cart.products);

            await cart.save();
            return res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công", cart });
        } catch (e) {
            console.error("Xóa sản phẩm thất bại: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    }
};

// Hàm tính tổng tiền của giỏ hàng
async function calculateTotalPrice(products) {
    let total = 0;
    for (let item of products) {
        const product = await Product.findById(item.productId);
        if (product) {
            total += product.price * item.quantity;
        }
    }
    return total;
}

module.exports = cartController;
