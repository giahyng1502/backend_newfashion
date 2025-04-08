const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }, // Người nhận thông báo

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        image : {
          type : String,
        },
        type: {
            type: String,
            enum: ["order_update", "promotion", "system", "message"],
            required: true
        }, // Loại thông báo

        message: {
            type: String,
            required: true
        }, // Nội dung thông báo

        isRead: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);

const Notify = mongoose.model("Notification", notificationSchema);

module.exports = Notify;