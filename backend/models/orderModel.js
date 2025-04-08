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
        enum: [0, 1, 2, 3, 4, 5, 6], // Chỉ chấp nhận các giá trị này
    },
    // 0 = Chờ xác nhận
    // 1 = Chờ giao hàng
    // 2 = Đang vận chuyển
    // 3 = Giao hàng thành công
    // 4 = Hủy đơn hàng
    // 5 = Hoàn đơn hàng
    // 6 = Chưa thanh toán
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
    paymentId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['momo', 'cod'],
        default: 'cod'
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
    items: [
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
            reviewId : {
                type: mongoose.Schema.ObjectId,
                ref: 'Review',
                default: null,
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

const paymentSchema = mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    transId: {
        type: String,
        required: true
    },
    requestId: {
        type: String,
        required: true
    },
    payType: {
        type: String,
        default: ''
    },
    orderType: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    resultCode: {
        type: Number,
        default: null
    },
    message: {
        type: String,
        default: ''
    },
    responseTime: {
        type: Date,
        default: Date.now
    },
});

const Payment = mongoose.model('Payment', paymentSchema);

const Order = mongoose.model('Order', orderSchema);
module.exports = {Payment, Order};
