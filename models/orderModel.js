const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    orderCode: {
        type: String,
        required: true,
        unique: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now, // Thời gian tạo đơn hàng
    },
    status: {
        type: Number,
        required: true,
        default: 0,
        enum: [0, 1, 2, 3, 4, 5], // Chỉ chấp nhận các giá trị này
    },
    // 0 = Chờ xác nhận
    // 1 = Chờ giao hàng
    // 2 = Đang vận chuyển
    // 3 = Giao hàng thành công
    // 4 = Hủy đơn hàng
    // 5 = Hoàn đơn hàng
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    voucherId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Voucher',
        default: null, // Nếu không có voucher thì để null
    },
    totalDiscount: {
        type: Number,
        default: 0,
    },
    totalVoucherDiscount: {
        type: Number,
        default: 0,
    },
    originalPrice : {
        type: Number,
        default: 0,
    },
    totalDiscountSale : {
        type: Number,
        default: 0,
    },
    point: {
        type: Number,
        default: 0,
    },
    momo : {
      type: Boolean,
      default: false,
    },
    shippingAddress: {
        address: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        name : {
            type: String,
            required: true,
        }
    },
    item: [
        {
            productId : {
              type: mongoose.Schema.ObjectId,
              ref: 'Product',
              required: true,
            },
            productName : {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            discountPrice : {
                type: Number,
                default: 0,
            },
            size : {
                type: String,
                required: true,
            },
            color : {
                imageColor : {
                    type: String,
                },
                nameColor : {
                    type: String,
                }
            },
            quantity: {
                type: Number,
                required: true,
            },
            total: {
                type: Number,
                required: true,
            },
            hasReview : {
                type: Boolean,
                default: false,
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
