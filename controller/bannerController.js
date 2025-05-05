const Banner = require("../models/bannerModel");

const bannerController = {
    getAll :async (req, res) => {
        try {
            const banner = await Banner.find({});
            if (!banner) {
                return res.status(404).json({message: 'Banner not found'});
            }
            return res.status(200).json({banner});
        }catch(err) {
            console.log(err);
            return res.status(500).json({message : "Lỗi hệ thống"});
        }
    },
    addBanner : async (req, res) => {
        try {
            const {imageUrl} = req.body;
            const banner = new Banner({imageUrl});
            await banner.save();
            return res.status(200).json({banner});
        }catch(err) {
            console.log(err);
            return res.status(500).json({message : "Lỗi hệ thống"});

        }
    },
    deleteBanner: async (req, res) => {
        try {
            const { bannerId } = req.params;

            // Đếm số lượng banner hiện tại
            const banner_count = await Banner.countDocuments();

            // Nếu chỉ còn 1 banner thì không cho xóa
            if (banner_count <= 1) {
                return res.status(400).json({ message: 'Phải giữ lại ít nhất 1 banner, không thể xóa hết.' });
            }

            // Tiến hành xóa
            const banner = await Banner.findByIdAndDelete(bannerId);

            // Nếu không tìm thấy banner theo id
            if (!banner) {
                return res.status(404).json({ message: 'Banner không tồn tại.' });
            }

            return res.status(200).json({ message: 'Xóa banner thành công.', banner });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Lỗi hệ thống.' });
        }
    }
}

module.exports = bannerController;
