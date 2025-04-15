const mongoose = require('mongoose');
const cartSchema = mongoose.Schema({
    products : [
        {
            productId : {
                type : mongoose.Schema.ObjectId,
                ref : "Product",
            },
            isSelected : {
                type : Boolean,
                default : false
            },
            disCountSale : {
                type : Number,
                min : 0,
                default : 0
            },
            quantity : {
                type: Number,
                default: 1
            },
            size : {
                type : String,
            },
            color : {
                imageColor : {
                    type: String,
                },
                nameColor : {
                    type: String,
                }
            },
            price : {
                type : Number,
            },
            addedAt: {
                type: Date,
                default: Date.now, // Lưu thời gian thêm sản phẩm vào giỏ hàng
            },
        }
    ],
    total : {
        type: Number,
        default: 0
    },
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : "users",
    }
},);
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;