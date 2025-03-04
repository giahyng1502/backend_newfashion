const mongoose = require('mongoose');
const cartSchema = mongoose.Schema({
    products : [
        {
            productId : {
                type : mongoose.Schema.ObjectId,
                ref : "Product",
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
            discount : {
                type : Number,
                min : 0
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