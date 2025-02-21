const {uploadImage} = require("../lib/cloudflare");
const {Category, SubCategory} = require("../models/categoryModel");
const {Product} = require("../models/productModel");
const subCateController = {
    addSubCategories: async (req, res) => {
        try {
            const {subCateName,categoryId} = req.body;
            const files = req.files;
            let category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({message: "Danh mục sản phẩm không tồn tại"});
            }
            let images = [];
            if (files) {
                images = await uploadImage(files);
            }
            const subCate = new SubCategory({
                subCateName,
                subImage : images[0]
            })
            const newSubCate = await subCate.save();
            console.log(newSubCate)
            category.subCategory.push(newSubCate._id);
            await category.save();
            return res.status(200).json({message : "Thêm subCategory thành công",data:newSubCate});
        }catch (e) {
            console.log("Có lỗi xẩy ra khi thêm subCate"+e.toString());
            return res.status(500).json({message : "Có lỗi xẩy ra khi thêm subCate"+e.toString()});
        }

    },
    getSubCateByCategory : async (req, res) => {
        try{
            const id = req.params.categoryId;
            const category = await Category.findById(id).populate('subCategory');
            if (!category) {
                return res.status(404).json({message : 'Lỗi không tồn tại danh mục sản phẩm này'})
            }
            return res.status(200).json({message : 'lấy subcategory thành công',data : category});
        }catch(err){
            console.log('Có lỗi khi lấy subcate theo category'+err.toString());
            return res.status(500).json({message : 'Lỗi khi lấy subcate theo category'+err.toString()});

        }
    },
    updateSubCategories : async (req, res) => {
        try{
            const id = req.params.id;
            const files = req.files;
            const {subCateName} = req.body;
            let images = [];
            if (files) {
                images = await uploadImage(files);
            }

            const subCate = await SubCategory.findByIdAndUpdate(id,{
                $set: {
                    subCateName : subCateName,
                    subImage : images[0]
                }
            },{new : true});
            if (!subCate) {
                return res.status(404).json({message : 'Lỗi khi update subcategory'});
            }
            return res.status(200).json({message : 'Update thành công',data:subCate});

        }catch(err){
            console.log('Có lỗi khi update subcate theo category'+err.toString());
            return res.status(500).json({message : 'Lỗi khi lấy subcate theo category'+err.toString()});

        }
    },
    deleteSubCategories: async (req, res) => {
        try {
            const id = req.params.id;
            const product = await Product.findOne({
                category : id
            })
            if (product) {
                return res.status(401).json({message : 'Không thể xóa subcategory này vì vẫn còn tồn tại sản phẩm'})
            }
            const subCate = await SubCategory.findByIdAndDelete(id);
            if (!subCate) {
                return res.status(404).json({ message: 'SubCategory không tồn tại' });
            }

            await Category.updateMany(
                { subCategory: id },
                { $pull: { subCategory: id } }
            );

            return res.status(200).json({ message: 'Xóa thành công', data: subCate });
        } catch (err) {
            console.error('Có lỗi khi xóa subcategory:', err);
            return res.status(500).json({ message: 'Lỗi khi xóa subcategory', error: err.toString() });
        }
    }

}
module.exports = subCateController;