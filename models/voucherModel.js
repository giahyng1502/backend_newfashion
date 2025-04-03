const mongoose = require('mongoose');
const voucherSchema = mongoose.Schema({
    voucherName: {
        type: String,
        required: true,
    },
    voucherDetail: {
        type: String,
        required: true,
    },
    limit : {
        type: Number,
        required: true,
        default: 1,
        min : 0
    },
    startDate : {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Cộng chính xác 7 ngày (tính theo giây)
    },
    discount: {
        type: Number,
        required: true,
        default: 10,// Giảm giá theo phần trăm
    },
    maxDiscountPrice: {
        type: Number, // Tối đa số tiền giảm giá có thể áp dụng
        required: true,
        default: 10000,
    }

})
const Voucher = mongoose.model("Voucher",voucherSchema);
module.exports = Voucher;