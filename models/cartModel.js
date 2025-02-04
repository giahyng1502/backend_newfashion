const mongoose = require('mongoose');
const cartSchema = mongoose.Schema({
    products : [
        {
            productId : {
                type : mongoose.Schema.ObjectId,
                ref : "products",
            },
            quantity : {
                type: Number,
                default: 1
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
})
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;