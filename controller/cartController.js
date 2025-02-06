const { Product } = require("../models/productModel");
const Cart = require("../models/cartModel");

const cartController = {
    // Lấy giỏ hàng của user
    getCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            console.log(userId);
            if (!userId) {
                return res.status(401).json({message : 'Người dùng không tồn tại'})
            }
            let cart = await Cart.findOne({ userId: userId }).populate("products.productId");

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
            const userId = req.user.userId;
            const { productId, quantity ,size,color} = req.body;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, products: [], totalPrice: 0 });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            }

            // Tìm sản phẩm trong giỏ hàng
            const index = cart.products.findIndex(p => p.productId.equals(productId)
                && p.size === size
                && p.color === color)
            if (index === -1) {
                // Nếu chưa có sản phẩm, thêm mới
                cart.products.push({ productId, quantity ,size : size, color : color});
            } else {
                // Nếu đã có, tăng số lượng
                cart.products[index].quantity += quantity;
            }

            // Cập nhật tổng tiền
            cart.total = await calculateTotalPrice(cart.products);

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
            const userId = req.user.userId;
            const { productInCartId, quantity, size, color } = req.body;

            // Kiểm tra nếu quantity là một số hợp lệ
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: "Số lượng không hợp lệ" });
            }

            // Kiểm tra nếu size và color không trống
            if (!size || !color) {
                return res.status(400).json({ message: "Size và màu sắc không được trống" });
            }

            // Tìm giỏ hàng của người dùng
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            // Tìm sản phẩm trong giỏ hàng thông qua productInCartId
            const index = cart.products.findIndex(p => p._id.equals(productInCartId));

            if (index === -1) {
                return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
            }

            // Cập nhật thông tin sản phẩm
            cart.products[index].quantity = Number(quantity);
            cart.products[index].color = color;
            cart.products[index].size = size;

            // Cập nhật tổng tiền giỏ hàng
            cart.total = await calculateTotalPrice(cart.products);

            // Lưu giỏ hàng
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
            const userId = req.user.userId;
            const { productInCartId } = req.body;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            // Lọc bỏ sản phẩm cần xóa
            cart.products = cart.products.filter(p => !p._id.equals(productInCartId));

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
