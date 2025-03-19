const Voucher = require("../models/voucherModel");
const mongoose = require("mongoose");
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
    },
    //  checkVoucher : async (req, res) => {
    //     try {
    //         const { id } = req.query;
    //
    //         if (!id) {
    //             return res.status(400).json({ message: "Vui lòng nhập id để kiểm tra voucher" });
    //         }
    //
    //         // Kiểm tra id có hợp lệ không
    //         if (!mongoose.Types.ObjectId.isValid(id)) {
    //             return res.status(400).json({ message: "ID không hợp lệ" });
    //         }
    //
    //         // Tìm voucher theo id
    //         const voucher = await Voucher.findById(id);
    //
    //         if (!voucher) {
    //             return res.status(404).json({ message: "Voucher không tồn tại" });
    //         }
    //
    //         const currentDate = new Date();
    //
    //         // Kiểm tra voucher có còn hạn sử dụng và số lượng còn không
    //         if (voucher.limit > 0 && currentDate >= voucher.startDate && currentDate <= voucher.endDate) {
    //             return res.status(200).json({ message: "Voucher hợp lệ", voucher });
    //         }
    //
    //         return res.status(400).json({ message: "Voucher đã hết hạn hoặc đạt giới hạn số lượng" });
    //
    //     } catch (error) {
    //         console.error("Lỗi server:", error.message);
    //         return res.status(500).json({ message: "Lỗi server", error });
    //     }
    // },



}

module.exports = voucherController;