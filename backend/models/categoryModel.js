const mongoose = require('mongoose');

const subCategories = mongoose.Schema({
    subCateName : {
        type: String,
        required: true,
    },
    subImage : {
        type: String,
        required: true,
    }
})

const categorySchema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
    imageCategory : {
        type: String,
        required: true,
    },
    subCategory : [{
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
    }]
});

const Category = mongoose.model('Category', categorySchema);
const SubCategory = mongoose.model('SubCategory', subCategories);

module.exports = {Category,SubCategory};
