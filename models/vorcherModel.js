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
    startDate : {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate : {
      type: Date,
      required: true,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000
    },
    discount: {
        type: Number,
        required: true,
        default: 10,
    }
})
const Voucher = mongoose.model("Voucher",voucherSchema);
module.exports = Voucher;