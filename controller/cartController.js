const { Product } = require("../models/productModel");
const Cart = require("../models/cartModel");
const SaleProduct = require("../models/SaleProduct");

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
                const { productId, quantity, size, color } = req.body;

                let cart = await Cart.findOne({ userId });
                if (!cart) {
                    cart = new Cart({ userId, products: [], totalPrice: 0 });
                }

                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ message: "Sản phẩm không tồn tại" });
                }

                // 🏷 Kiểm tra xem sản phẩm có đang giảm giá không
                let discount = 0;
                const saleProduct = await SaleProduct.findOne({ productId });
                if (saleProduct && new Date(saleProduct.expireAt) > new Date()) {
                    if (saleProduct.limit > 0) {
                        discount = saleProduct.discount;
                    }
                }

                const discountedPrice = product.price * (1 - discount / 100); // Tính giá sau giảm giá

                // 🔍 Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                const index = cart.products.findIndex(p =>
                    p.productId.equals(productId) && p.size === size && p.color === color
                );

                if (index === -1) {
                    // Nếu sản phẩm chưa có trong giỏ hàng
                    cart.products.push({ productId, quantity, disCountSale: discount ,size, color, price: discountedPrice });
                } else {
                    // Nếu sản phẩm đã có thì tăng số lượng
                    cart.products[index].quantity += quantity;
                    cart.products[index].price = discountedPrice; // Cập nhật giá theo giảm giá
                }

                // 🧾 Cập nhật tổng giá tiền của giỏ hàng
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

            // Kiểm tra nếu quantity không hợp lệ
            if (isNaN(quantity) || quantity < 0) {
                return res.status(400).json({ message: "Số lượng không hợp lệ" });
            }

            // Kiểm tra nếu size và color không trống
            if (!size || !color) {
                return res.status(400).json({ message: "Size và màu sắc không được trống" });
            }

            // Tìm giỏ hàng của user
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
            }

            // Tìm sản phẩm trong giỏ hàng
            const index = cart.products.findIndex(p => p._id.equals(productInCartId));
            if (index === -1) {
                return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
            }

            // Nếu quantity = 0 -> XÓA sản phẩm khỏi giỏ hàng
            if (quantity === 0) {
                cart.products.splice(index, 1);
            } else {
                // Lấy thông tin sản phẩm từ DB
                const product = await Product.findById(cart.products[index].productId);
                if (!product) {
                    return res.status(404).json({ message: "Sản phẩm không tồn tại" });
                }

                // Kiểm tra xem sản phẩm có khuyến mãi không
                let discount = 0;
                const saleProduct = await SaleProduct.findOne({ productId: product._id });

                if (saleProduct && new Date(saleProduct.expireAt) > new Date()) {
                    discount = saleProduct.discount;
                }

                // Cập nhật thông tin sản phẩm trong giỏ hàng
                cart.products[index].quantity = quantity;
                cart.products[index].size = size;
                cart.products[index].color = color;
                cart.products[index].price = product.price * (1 - discount / 100); // Cập nhật giá sau giảm giá
            }

            // Cập nhật tổng tiền giỏ hàng
            cart.total = await calculateTotalPrice(cart.products);

            // Lưu thay đổi vào DB
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
            const { productInCartId } = req.params;

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
            total += item.price * item.quantity; // Sử dụng giá đã giảm (nếu có)
    }
    return total;
}


module.exports = cartController;
