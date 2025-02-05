const mongoose = require('mongoose');
const cartSchema = mongoose.Schema({
    products : [
        {
            productId : {
                type : mongoose.Schema.ObjectId,
                ref : "Product",
            },
            quantity : {
                type: Number,
                default: 1
            },
            size : {
                type : String,
            },
            color : {
                type : String,
            }
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
})
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;