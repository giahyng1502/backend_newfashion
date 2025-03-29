const { User } = require("../models/userModel");
const Cart = require("../models/cartModel");
const Voucher = require("../models/voucherModel");
const Order = require("../models/orderModel");
const SaleProduct = require("../models/SaleProduct");
const {Product} = require("../models/productModel");
const generateOrderCode = require("../lib/generateCode");
const allowedStatus = [0, 1, 2, 3, 4, 5];
const orderController = {
        create: async (req, res) => {
            try {
                const {address, phoneNumber,name, voucherId, point,momo} = req.body;
                const userId = req.user.userId;
                let disCountSale = 0;
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(400).json({message: 'Không tìm thấy người dùng'});
                }

                // Tìm giỏ hàng của user
                let cart = await Cart.findOne({userId: userId}).populate('products.productId');
                if (!cart || cart.products.length === 0) {
                    return res.status(400).json({message: 'Giỏ hàng trống'});
                }
                // Lọc sản phẩm được chọn để tạo đơn hàng
                const selectedCart = cart.products.filter(item => item.isSelected === true);

                if (selectedCart.length === 0) {
                    return res.status(400).json({ message: 'Không có sản phẩm nào được chọn' });
                }

                // Tính tổng tiền sản phẩm trong giỏ hàng
                let totalPrice = 0;
                for (const item of selectedCart) {
                    let productPrice = item.productId.price * item.quantity;

                    // Kiểm tra sản phẩm có trong SaleProduct (sản phẩm giảm giá không)
                    const saleProduct = await SaleProduct.findOne({productId: item.productId._id});

                    if (saleProduct) {
                        // Nếu có giảm giá, tính lại giá sau giảm
                        if (saleProduct.limit > 0) {
                            const discountPrice = productPrice - (productPrice * saleProduct.discount / 100);
                            totalPrice += discountPrice;
                            disCountSale = saleProduct.discount;
                            saleProduct.limit = saleProduct.limit - 1;
                            await saleProduct.save();
                        }else{
                            await SaleProduct.findByIdAndDelete(saleProduct._id);
                        }
                    } else {
                        // Nếu không có giảm giá, tính theo giá gốc
                        totalPrice += productPrice;
                    }
                }

                // Kiểm tra và áp dụng voucher nếu có
                if (voucherId) {
                    const voucher = await Voucher.findById(voucherId);
                    if (!voucher) {
                        return res.status(404).json({message: 'Voucher không tồn tại'});
                    }
                    if (voucher.limit === 0) {
                        return res.status(404).json({message: 'Voucher đã hết lượt sử dụng'});
                    }

                    if (voucher.endDate) {
                        const currentTime = Date.now(); // Lấy thời gian hiện tại
                        const endDateTime = new Date(voucher.endDate).getTime(); // Lấy thời gian của voucher

                        if (endDateTime - currentTime < 0) {
                            return res.status(404).json({message: 'Voucher đã hết hạn'});
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

                const items = selectedCart.map(item => ({
                    productName: item.productId.name,
                    price: item.productId.price * item.quantity,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    productId : item.productId
                }));

                // Tạo đơn hàng
                const orderCode = `OD${generateOrderCode(userId)}`
                const order = new Order({
                    userId: userId,
                    orderCode,
                    item: items,
                    totalPrice: totalPrice,
                    statusHistory: {
                        updatedBy: userId
                    },
                    disCountSale : disCountSale,
                    voucherId: voucherId || null, // Chỉ gửi voucherId nếu có
                    point: point || null,
                    shippingAddress: {address, phoneNumber,name}
                });

                await order.save();
                // xóa những sản phẩm đã được select
                cart.products = cart.products.filter(item => item.isSelected === false);

                    cart.total = cart.products.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    await cart.save();

                return res.status(201).json({message: "Đơn hàng đã được tạo thành công", order});

            } catch (e) {
                console.error("Tạo order thất bại: " + e.message);
                return res.status(500).json({
                    message: 'Tạo order thất bại',
                    error: e.message
                });
            }
        },
    getOrderByUser: async (req, res) => {
        try{
            const userId = req.user.userId;
            const order = await Order.find({ userId: userId })
                .populate("statusHistory.updatedBy",'name')
                .sort({"statusHistory.timestamp" : -1});
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
        try{

            const orderId = req.params.orderId;
            const status = req.body.status;
            const admin = req.user.userId;
            const orderStatus = await Order.findById(orderId);

            if (!orderStatus) {
                return res.status(200).json({message : 'Đơn hàng không tồn tại'})
            }
            if (!allowedStatus.includes(status)) {
                return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ!" });
            }
            if (orderStatus.status === status) {
                return res.status(200).json({message : 'Vui lòng thay đổi trạng thái đơn hàng'})
            }
            if (status === 2) {
                for (const item of orderStatus.item) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                sold: item.quantity,   // Tăng số lượng đã bán
                                stock: -item.quantity  // Giảm số lượng tồn kho
                            }
                        },
                        { new: true }
                    );
                }
            }
            if (status === 5) {
                for (const item of orderStatus.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                sold: - item.quantity,
                                stock: item.quantity
                            }
                        },
                        { new: true }
                    );
                }
            }

            orderStatus.status = status;
            orderStatus.statusHistory.push({
                status : status,
                updatedBy : admin,
            })
            orderStatus.save();
            if (status === 4) {
                if (orderStatus.point > 0) {
                    const user = await User.findByIdAndUpdate(orderStatus.userId,{
                        point: orderStatus.point
                    })
                }
            }
            return res.status(200).json({message : 'Cập nhập đơn hàng thành công', data : orderStatus})
        }catch (e) {
            console.log("Lỗi xẩy ra khi cập nhập trạng thái đơn hàng"+e.message);
            return res.status(500).json({message : 'Lỗi sever',error: e.message});
        }
    },
    searchOrder: async (req, res) => {
        try {
            let { page = 1, limit = 10, sortField = "dateCreated", sortOrder = "desc", search } = req.query;

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
