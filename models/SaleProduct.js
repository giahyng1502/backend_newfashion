const mongoose = require('mongoose');

const saleProductSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Giảm giá trong khoảng từ 0% đến 100%
    },
    remainDate: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Cộng chính xác 7 ngày (tính theo giây)
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const SaleProduct = mongoose.model('SaleProduct', saleProductSchema);

module.exports = SaleProduct;
