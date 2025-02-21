const mongoose = require('mongoose');

const saleProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    limit : {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    expireAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo TTL Index trên `expireAt`
// MongoDB sẽ tự động xóa các document sau thời gian `expireAt`
saleProductSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const SaleProduct = mongoose.model('SaleProduct', saleProductSchema);

module.exports = SaleProduct;
