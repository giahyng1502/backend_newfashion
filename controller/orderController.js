const { User } = require("../models/userModel");
const Cart = require("../models/cartModel");
const Voucher = require("../models/voucherModel");
const Order = require("../models/orderVoucher");

const orderController = {
    create: async (req, res) => {
        try {
            const { address, phoneNumber, voucherId, point } = req.body;
            const userId = req.user.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: 'Không tìm thấy người dùng' });
            }

            // Tìm giỏ hàng của user
            const cart = await Cart.findOne({ userId: userId }).populate('products.productId');
            if (!cart || cart.products.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống' });
            }

            // Tính tổng tiền sản phẩm trong giỏ hàng
            let totalPrice = 0;
            cart.products.forEach(item => {
                totalPrice += item.productId.price * item.quantity;
            });

            // Kiểm tra và áp dụng voucher nếu có
            if (voucherId) {
                const voucher = await Voucher.findById(voucherId);
                console.log(voucher);
                if (!voucher) {
                    return res.status(404).json({ message: 'Voucher không tồn tại' });
                }
                if (voucher.limit === 0) {
                    return res.status(404).json({ message: 'Voucher đã hết lượt sử dụng' });
                }

                if (voucher.endDate) {
                    const currentTime = Date.now(); // Lấy thời gian hiện tại
                    const endDateTime = new Date(voucher.endDate).getTime(); // Lấy thời gian của voucher

                    if (endDateTime - currentTime < 0) {
                        return res.status(404).json({ message: 'Voucher đã hết hạn' });
                    }
                }

                totalPrice -= totalPrice * voucher.discount / 100; // Giảm giá
                voucher.limit -= 1; // Giảm số lượt sử dụng
                await voucher.save();
            }

            // Áp dụng điểm thưởng
            if (point) {
                if (point > totalPrice) {
                    totalPrice = 0;
                    user.point -= totalPrice;
                } else {
                    totalPrice -= point;
                    user.point -= point;
                }
                await user.save();
            }

            // Tạo đơn hàng
            const order = new Order({
                userId: userId,
                item: cart.products,
                totalPrice: totalPrice,
                voucherId: voucherId || null, // Chỉ gửi voucherId nếu có
                point: point || null,
                shippingAddress: { address, phoneNumber }
            });

            await order.save();
            await Cart.findOneAndDelete({ userId: userId });

            return res.status(201).json({ message: "Đơn hàng đã được tạo thành công", order });

        } catch (e) {
            console.error("Tạo order thất bại: " + e.message);
            return res.status(500).json({
                message: 'Tạo order thất bại',
                error: e.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const orders = await Order.find();
            return res.status(200).json({ message: 'Lấy thông tin đơn hàng thành công', orders });
        } catch (e) {
            console.error("Lấy đơn hàng thất bại: " + e.message);
            return res.status(500).json({
                message: 'Lỗi server',
                error: e.message
            });
        }
    },
    getOrderById: async (req, res) => {
        try{
            const userId = req.user.userId;
            const order = await Order.findOne({ userId: userId });
            if (!order) {
                return res.status(200).json({message:'Bạn chưa có đơn hàng nào'});
            }
            return res.status(200).json({message : 'Lấy đơn hàng thành công',data : order})
        }catch (e) {
            console.log("Lỗi xẩy ra khi lấy order theo ID"+e.message);
            return res.status(500).json({message : 'Lỗi sever',error: e.message});
        }
    },
    cancelOrder: async (req, res) => {
        try{
            const orderId = req.params.orderId;
            const userId = req.user.userId;
            const order = await Order.findById(orderId);
                if (order.status !== 0) {
                    return res.status(400).json({message :'Bạn chỉ có thể hủy đơn hàng khi đơn hàng đang ở trong trạng thái chờ xác nhận'});
                }
                if (userId.toString() !== order.userId.toString()) {
                    return res.status(400).json({message :'Bạn không có quyền hủy'});
                }
            order.status = 4;
            await order.save();
            return res.status(200).json({message : 'Hủy đơn hàng thành công', data : order})
        }catch (e) {
            console.log("Lỗi xẩy ra khi cập nhập trạng thái đơn hàng"+e.message);
            return res.status(500).json({message : 'Lỗi sever',error: e.message});
        }
    },
    updateStatus: async (req, res) => {
        try{
            const orderId = req.params.orderId;
            const status = req.body.status;
            const orderStatus = await Order.findByIdAndUpdate(orderId, {status : status}, { new: true });

            return res.status(200).json({message : 'Cập nhập đơn hàng thành công', data : orderStatus})
        }catch (e) {
            console.log("Lỗi xẩy ra khi cập nhập trạng thái đơn hàng"+e.message);
            return res.status(500).json({message : 'Lỗi sever',error: e.message});
        }
    }
};

module.exports = orderController;
