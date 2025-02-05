const mongoose = require('mongoose');
const orderSchema = mongoose.Schema({
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true,
    },
    dateCreated : {
        type : Date,
        default : Date.now,
    },
    status : {
        type: Number,
        required: true,
        default: 0,
        // 0 = chờ xác nhận ,
        // 1 = chờ giao hàng ,
        // 2 = Đang vận chuyển ,
        // 3 = Vận chuyển thành công.
        // 4 = Hủy đơn hàng
    },
    totalPrice : {
        type : Number,
        required: true,
        default: 0,
    },
    voucherId : {
        type : String,
    },
    point : {
      type : Number,
      default : 0
    },
    shippingAddress :
        {
            address : {
                type : String,
                required : true,
            },
            phoneNumber : {
                type : String,
                required : true,
            }
        },
    item : [
        {
            productId : {
                type : mongoose.Schema.ObjectId,
                ref : 'Product',
                required : true,
            },
            quantity : {
                type : Number,
                required: true,
            },
        }
    ]
})
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;