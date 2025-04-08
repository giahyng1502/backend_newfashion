const { User } = require("../models/userModel");
const Cart = require("../models/cartModel");
const Voucher = require("../models/voucherModel");
const SaleProduct = require("../models/SaleProduct");
const {Product} = require("../models/productModel");
const generateOrderCode = require("../lib/generateCode");
const Notify = require("../models/notificationModel");
const {Order} = require("../models/orderModel");
const allowedStatus = [0, 1, 2, 3, 4, 5];
const orderController = {
    create: async (req, res) => {
        try {
            const { address, phoneNumber, name, voucherId, point, momo } = req.body;
            const userId = req.user.userId;
            let totalDiscount = 0; // Tổng số tiền giảm giá
            let originalPrice = 0; // Tổng giá gốc
            let totalVoucherDiscount = 0;
            let totalDiscountSale = 0;
            // Kiểm tra user có tồn tại không
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: 'Không tìm thấy người dùng' });
            }

            // Tìm giỏ hàng của user
            let cart = await Cart.findOne({ userId: userId }).populate('products.productId');
            if (!cart || cart.products.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống' });
            }

            // Lọc sản phẩm được chọn để tạo đơn hàng
            const selectedCart = cart.products.filter(item => item.isSelected === true);
            if (selectedCart.length === 0) {
                return res.status(400).json({ message: 'Không có sản phẩm nào được chọn' });
            }

            // Tính tổng tiền sản phẩm trước khi giảm giá
            let totalPrice = 0;
            const items = [];
            for (const item of selectedCart) {
                let productPrice = item.productId.price * item.quantity;
                originalPrice += productPrice; // Tính tổng giá gốc
                // Kiểm tra sản phẩm có giảm giá không
                if (item.productId.stock < item.quantity) {
                    return res.status(400).json({message : `${item.productId.name} không đủ số lượng cung cấp`, outStock : true})
                }
                const saleProduct = await SaleProduct.findOne({ productId: item.productId._id });
                let discountPrice = 0;
                if (saleProduct) {
                    if (saleProduct.limit > 0) {
                        if (saleProduct.limit >= item.quantity) {
                            console.log('sản phẩm đủ số lượng giảm giá')
                            // Trường hợp đủ số lượng để giảm giá toàn bộ
                            const discountAmount = (productPrice * saleProduct.discount) / 100;
                            productPrice -= discountAmount;
                            totalDiscount += discountAmount * item.quantity; // Tổng tiền giảm giá
                            discountPrice = discountAmount * item.quantity;
                            totalDiscountSale += discountAmount * item.quantity;

                            // Cập nhật số lượng giảm giá còn lại
                            saleProduct.limit -= item.quantity;
                        } else {
                            console.log('sản phẩm không số lượng giảm giá')

                            // Trường hợp chỉ một phần số lượng được giảm giá
                            const discountAmount = (productPrice * saleProduct.discount) / 100;

                            // Số lượng sản phẩm được giảm giá
                            const discountQuantity = saleProduct.limit;
                            const normalQuantity = item.quantity - discountQuantity; // Số lượng tính giá gốc

                            // Tính tổng giảm giá chỉ cho số sản phẩm trong giới hạn
                            totalDiscount += discountAmount * discountQuantity;
                            discountPrice = discountAmount;
                            totalDiscountSale += discountAmount * discountQuantity;

                            // Giá tổng cho sản phẩm
                            const totalPriceWithDiscount = discountQuantity * (productPrice - discountAmount);
                            const totalPriceWithoutDiscount = normalQuantity * productPrice;

                            // Tính giá cuối cùng của sản phẩm
                            productPrice = totalPriceWithDiscount + totalPriceWithoutDiscount

                            // Giảm số lượng còn lại trong chương trình khuyến mãi
                            saleProduct.limit = 0;
                        }

                        await saleProduct.save();
                    } else {
                        await SaleProduct.findByIdAndDelete(saleProduct._id);
                    }
                }
                totalPrice += productPrice;
                items.push({
                    productId: item.productId._id,
                    productName: item.productId.name,
                    price: item.productId.price,
                    size: item.size,
                    total : productPrice,
                    color: item.color,
                    quantity: item.quantity,
                    hasReview: false,
                    discountPrice: discountPrice, // Lưu giảm giá của từng sản phẩm
                });
            }

            // Kiểm tra và áp dụng voucher nếu có
            if (voucherId) {
                const voucher = await Voucher.findById(voucherId);
                if (!voucher) {
                    return res.status(404).json({ message: 'Voucher không tồn tại' });
                }
                if (voucher.limit === 0) {
                    return res.status(404).json({ message: 'Voucher đã hết lượt sử dụng' });
                }
                if (voucher.endDate && new Date(voucher.endDate) < Date.now()) {
                    return res.status(404).json({ message: 'Voucher đã hết hạn' });
                }

                const voucherDiscountAmount = (totalPrice * voucher.discount) / 100;
                const finalVoucherDiscountAmount = Math.min(voucherDiscountAmount, voucher.maxDiscountPrice);
                totalPrice -= finalVoucherDiscountAmount;
                totalDiscount += finalVoucherDiscountAmount;
                totalVoucherDiscount = finalVoucherDiscountAmount;
                // Giảm số lượt sử dụng voucher
                voucher.limit -= 1;
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

            // Đảm bảo tổng giá không bị âm
            if (totalPrice < 0) totalPrice = 0;



            // Tạo mã đơn hàng
            const orderCode = `OD${generateOrderCode(userId)}`;
            const statusHistory = [{
                status: 0,
                updatedBy : userId
            }]
            // Tạo đơn hàng
            let order;
            if (momo === 'momo') {
                order = new Order({
                    userId: userId,
                    orderCode,
                    items: items,
                    originalPrice,
                    totalPrice,
                    status : 6,
                    totalDiscount,
                    paymentMethod: momo,
                    totalVoucherDiscount,
                    totalDiscountSale,
                    voucherId: voucherId || null,
                    point: point || null,
                    shippingAddress: { address, phoneNumber, name },
                    statusHistory : {
                        status: 6,
                        updatedBy : userId
                    }
                });
            }else {
                order = new Order({
                    userId: userId,
                    orderCode,
                    items: items,
                    originalPrice,
                    totalPrice,
                    totalDiscount,
                    totalVoucherDiscount,
                    totalDiscountSale,
                    voucherId: voucherId || null,
                    point: point || null,
                    shippingAddress: { address, phoneNumber, name },
                    statusHistory
                });
            }

            await order.save();

            // Xóa các sản phẩm đã đặt khỏi giỏ hàng
            cart.products = cart.products.filter(item => !item.isSelected);
            cart.total = cart.products.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);
            await cart.save();

            return res.status(201).json({ message: "Đơn hàng đã được tạo thành công", order });

        } catch (e) {
            console.error("Tạo order thất bại:", e.message);
            return res.status(500).json({ message: 'Tạo order thất bại', error: e.message });
        }
    },

    getOrderByUser: async (req, res) => {
        try {
            const userId = req.user.userId;
            let { status, page = 1, limit = 10, sortField = "dateCreated", sortOrder = "desc" } = req.query;

            // Đảm bảo `page` và `limit` luôn là số nguyên dương
            page = Math.max(1, parseInt(page)) || 1;
            limit = Math.max(1, parseInt(limit)) || 10;

            // Tạo bộ lọc tìm kiếm
            const filter = { userId: userId };
            if (status) {
                filter.status = status; // Lọc theo trạng thái đơn hàng
            }

            // Tạo bộ sắp xếp
            const sortOption = {};
            sortOption[sortField] = sortOrder === "desc" ? -1 : 1;

            // Đếm tổng số đơn hàng phù hợp
            const totalOrders = await Order.countDocuments(filter);
            const totalPages = Math.ceil(totalOrders / limit);
            if (page > totalPages) page = totalPages || 1;

            // Lấy danh sách đơn hàng theo phân trang
            const orders = await Order.find(filter)
                .populate("statusHistory.updatedBy", "name")
                .populate("items.reviewId")
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit);

            return res.status(200).json({
                message: "Lấy đơn hàng thành công",
                data: orders,
                total: totalOrders,
                totalPages,
                currentPage: page,
            });
        } catch (e) {
            console.error("Lỗi xảy ra khi lấy đơn hàng theo user:", e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },
    cancelOrder: async (req, res) => {
        try{
            const orderId = req.params.orderId;
            const userId = req.user.userId;
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({message:'Đơn hàng này không tồn tại'})
            }
                if (order.status !== 0) {
                    return res.status(400).json({message :'Bạn chỉ có thể hủy đơn hàng khi đơn hàng đang ở trong trạng thái chờ xác nhận'});
                }
                if (userId.toString() !== order.userId.toString()) {
                    return res.status(400).json({message :'Bạn không có quyền hủy'});
                }

                order.status = 4;
                order.statusHistory.push({
                    status : 4,
                    updatedBy : userId,
                })
            await order.save();
                if (order.point > 0) {
                    const user = await User.findByIdAndUpdate(order.userId,{
                        point: order.point
                    })
                }
            return res.status(200).json({message : 'Hủy đơn hàng thành công', data : order})
        }catch (e) {
            console.log("Lỗi xẩy ra khi cập nhập trạng thái đơn hàng"+e.message);
            return res.status(500).json({message : 'Lỗi sever',error: e.message});
        }
    },
    updateStatus: async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const status = req.body.status;
            const admin = req.user.userId;
            const orderStatus = await Order.findById(orderId);

            if (!orderStatus) {
                return res.status(404).json({ message: "Đơn hàng không tồn tại" });
            }
            if (!allowedStatus.includes(status)) {
                return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ!" });
            }
            if (orderStatus.status === status) {
                return res.status(400).json({ message: "Vui lòng thay đổi trạng thái đơn hàng" });
            }

            // ❌ Không thể cập nhật trạng thái lùi về (trừ khi hủy đơn hàng từ trạng thái 0 hoặc 1)
            if (status < orderStatus.status && !(status === 4 && [0, 1].includes(orderStatus.status))) {
                return res.status(403).json({ message: "Không thể cập nhật trạng thái lùi về!" });
            }

            // ❌ Chỉ có thể hủy đơn hàng nếu trạng thái hiện tại là 0 hoặc 1
            if (status === 4 && ![0, 1].includes(orderStatus.status)) {
                return res.status(403).json({ message: "Chỉ có thể hủy đơn hàng khi ở trạng thái chờ xác nhận hoặc chờ giao hàng!" });
            }

            // ✅ Cập nhật sản phẩm khi chuyển sang trạng thái Đang vận chuyển (2)
            if (status === 2) {
                for (const item of orderStatus.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                sold: item.quantity,  // Tăng số lượng đã bán
                                stock: -item.quantity // Giảm số lượng tồn kho
                            }
                        },
                        { new: true }
                    );
                }
            }

            // ✅ Hoàn đơn hàng (trạng thái 5) -> Hoàn lại số lượng sản phẩm
            if (status === 5) {
                for (const item of orderStatus.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                sold: -item.quantity, // Giảm số lượng đã bán
                                stock: item.quantity  // Tăng số lượng tồn kho
                            }
                        },
                        { new: true }
                    );
                }
            }

            // ✅ Cập nhật trạng thái đơn hàng
            orderStatus.status = status;
            orderStatus.statusHistory.push({
                status: status,
                updatedBy: admin,
            });
            await orderStatus.save();

            // ✅ Cộng điểm thưởng nếu đơn hàng giao thành công
            if (status === 3 && orderStatus.totalPrice > 0) {
                const rewardPoints = Math.floor(orderStatus.totalPrice * 0.02); // Tính 2% tổng tiền, làm tròn xuống
                await User.findByIdAndUpdate(orderStatus.userId, {
                    $inc: { point: rewardPoints }
                });
                console.log('cdsiahc')
            }
            const messages = {
                0: `Đơn hàng đang chờ xác nhận.`,
                1: `Đơn hàng đã được xác nhận và đang chờ giao hàng.`,
                2: `Đơn hàng đang được vận chuyển đến bạn.`,
                3: `Đơn hàng đã giao thành công. Cảm ơn bạn đã mua sắm!`,
                4: `Đơn hàng đã bị hủy.`,
                5: `Đơn hàng đã được hoàn lại.`,
            };
            const product = await Product.findById(orderStatus.items[0].productId);
            const notification = new Notify({
                userId : orderStatus.userId,
                orderId : orderId,
                type : 'order_update',
                image : product?.image[0],
                message : messages[status]
            });
            const newNotify = await notification.save();
            global.io.to(orderStatus.userId.toString()).emit("orderStatusUpdate", newNotify);
            return res.status(200).json({ message: "Cập nhật đơn hàng thành công", data: orderStatus });
        } catch (e) {
            console.error("Lỗi xảy ra khi cập nhật trạng thái đơn hàng: " + e.message);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },
    searchOrder: async (req, res) => {
        try {
            let { page = 1, limit = 10, sortField = "status", sortOrder = "asc", search } = req.query;

            // Đảm bảo `page` và `limit` luôn là số nguyên dương
            page = Math.max(1, parseInt(page)) || 1;
            limit = Math.max(1, parseInt(limit)) || 10;

            // Tạo bộ lọc tìm kiếm chung
            const filter = {};
            if (search && search.trim() !== "") {
                filter.$or = [
                    { "shippingAddress.phoneNumber": { $regex: search, $options: "i" } },  // Số điện thoại
                    { orderCode: { $regex: search, $options: "i" } },    // Mã đơn hàng
                    { "shippingAddress.name": { $regex: search, $options: "i" } }  // Tên khách hàng
                ];
            }
            // Tạo bộ sắp xếp
            const sortOption = {};
            if (sortField === "status") {
                sortOption["status"] = sortOrder === "desc" ? -1 : 1;
                sortOption["dateCreated"] = -1;
            } else {
                sortOption[sortField] = sortOrder === "desc" ? -1 : 1;
            }

            // Đếm tổng số đơn hàng phù hợp trước khi phân trang
            const totalOrders = await Order.countDocuments(filter);

            // Nếu page vượt quá số lượng đơn hàng có sẵn, điều chỉnh về trang cuối cùng
            const totalPages = Math.ceil(totalOrders / limit);
            if (page > totalPages) page = totalPages || 1;

            // Lấy danh sách đơn hàng với phân trang và tìm kiếm chung
            const orders = await Order.find(filter)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("statusHistory.updatedBy", "name avatar role");

            res.status(200).json({
                data: orders,
                total: totalOrders,
                totalPages,
                currentPage: page,
                limit,
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
};

module.exports = orderController;
