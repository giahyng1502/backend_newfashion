const mongoose = require("mongoose");

const bannerModel = new mongoose.Schema({
    imageUrl: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

const Banner = mongoose.model("Banner", bannerModel)
module.exports = Banner;
