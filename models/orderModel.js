const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now, // Thời gian tạo đơn hàng
    },
    status: {
        type: Number,
        required: true,
        default: 0,
        // 0 = Chờ xác nhận
        // 1 = Chờ giao hàng
        // 2 = Đang vận chuyển
        // 3 = Giao hàng thành công
        // 4 = Hủy đơn hàng
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    voucherId: {
        type: String,
    },
    point: {
        type: Number,
        default: 0,
    },
    shippingAddress: {
        address: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        }
    },
    item: [
        {
            productName : {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            size : {
                type: String,
                required: true,
            },
            color : {
              type: String,
              required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        }
    ],
    statusHistory: [
        {
            status: {
                type: Number,
                required: true,
                default: 0,
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            updatedBy: {
                type: mongoose.Schema.ObjectId,
                ref: 'User', // Lưu ID của người thay đổi trạng thái (Admin, User)
            }
        }
    ]
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
