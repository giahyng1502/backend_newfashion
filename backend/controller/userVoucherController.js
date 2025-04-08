const Voucher = require("../models/voucherModel");
const {UserVoucher} = require("../models/userModel");

const saveVoucherToWallet = async (req, res) => {
    try {
        const { voucherId } = req.body;
        const userId = req.user.userId;
        if (!voucherId) {
            return res.status(400).json({ message: "Thiếu thông tin voucherId" });
        }

        // Kiểm tra voucher tồn tại không
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher không tồn tại" });
        }

        // Kiểm tra số lượng voucher
        if (voucher.limit <= 0) {
            return res.status(400).json({ message: "Voucher đã hết số lượng" });
        }

        // Kiểm tra nếu user đã có voucher này trong ví chưa
        const existingVoucher = await UserVoucher.findOne({ userId, voucherId });
        if (existingVoucher) {
            return res.status(400).json({ message: "Bạn đã có voucher này trong ví" });
        }

        // Lưu vào ví user
        const userVoucher = new UserVoucher({
            userId,
            voucherId,
        });

        await userVoucher.save();

        return res.status(200).json({ message: "Voucher đã được lưu vào ví", userVoucher });

    } catch (error) {
        console.error("Lỗi server:", error.message);
        return res.status(500).json({ message: "Lỗi server", error });
    }
};

const getUserVouchers = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy userId từ middleware xác thực

        if (!userId) {
            return res.status(400).json({ message: "Thiếu thông tin userId" });
        }

        // Tìm tất cả voucher trong ví của user, lấy voucher còn hạn & còn số lượng
        const userVouchers = await UserVoucher.find({ userId })
            .populate({
                path: "voucherId",
                match: {
                    limit: { $gt: 0 }, // Lọc voucher còn số lượng
                    endDate: { $gte: new Date() } // Lọc voucher còn hạn sử dụng
                }
            });

        // Loại bỏ những userVoucher có `voucherId = null` (do `match` filter)
        const validVouchers = userVouchers.filter(uv => uv.voucherId !== null);

        if (validVouchers.length === 0) {
            return res.status(404).json({ message: "Không có voucher nào trong ví" });
        }

        return res.status(200).json({ vouchers: validVouchers });
    } catch (error) {
        console.error("Lỗi server:", error.message);
        return res.status(500).json({ message: "Lỗi server", error });
    }
};



module.exports = { saveVoucherToWallet,getUserVouchers };
