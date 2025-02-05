const Voucher = require("../models/voucherModel");
const voucherController = {
    getAll: async (req, res) => {
        try {
            const vouchers = await Voucher.find();
            return res.status(200).json({message : 'Lấy voucher thành công',data: vouchers});

        }catch (e) {
            console.log("Thêm voucher xẩy ra lỗi : "+e.message);
            return res.status(500).json({
                message : 'Lỗi server',
                error: e.message
            })
        }
    },
    createVoucher : async (req, res) => {
        try {
            const voucher = req.body;
            const newVoucher = new Voucher(voucher);
            await newVoucher.save();
            return res.status(200).json({message : 'Thêm voucher thành công',data: newVoucher});
        }catch (e) {
            console.log("Thêm voucher xẩy ra lỗi : "+e.message);
            return res.status(500).json({
                message : 'Lỗi server',
                error: e.message
            })
        }
    },
    updateVoucher : async (req, res) => {
        try {
            const voucher = req.body;
            const voucherId = req.params.voucherId;
            const updateVoucher = await Voucher.findByIdAndUpdate(voucherId,voucher,{new: true});
            if (!updateVoucher) {
                return req.status(404).json({
                    message : 'update voucher thất bại'
                })
            }
            return res.status(200).json({message : 'Sửa voucher thành công',data: updateVoucher});

        }catch (e) {
            console.log("Cập nhập voucher xẩy ra lỗi : "+e.message);
            return res.status(500).json({
                message : 'Lỗi server',
                error: e.message
            })
        }
    },
    removeVoucher : async (req, res) => {
        try {
            const voucherId = req.params.voucherId;
            const deleteVoucher = await Voucher.findByIdAndDelete(voucherId);
            if (!deleteVoucher) {
                return req.status(404).json({
                    message : 'Xóa voucher thất bại'
                })
            }
            return res.status(200).json({message : 'Xóa voucher thành công',data: deleteVoucher});

        }catch (e) {
            console.log("Thêm voucher xẩy ra lỗi : "+e.message);
            return res.status(500).json({
                message : 'Lỗi server',
                error: e.message
            })
        }
    }

}

module.exports = voucherController;