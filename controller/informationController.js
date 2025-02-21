const mongoose = require("mongoose");
const { Information } = require("../models/userModel");

const InformationController = {
    // Lấy thông tin người dùng theo userId
    getUserInformation: async (req, res) => {
        try {
            const userId = req.user.userId;
            const info = await Information.find({ userId });

            if (!info) {
                return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
            }

            return res.status(200).json({ message: "Lấy thông tin thành công", data: info });
        } catch (error) {
            console.error("Lỗi lấy thông tin người dùng:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Cập nhật hoặc thêm mới thông tin người dùng
    upsertInformation: async (req, res) => {
        try {
            const userId = req.user.userId;
            const inforId = req.params.inforId;
            const { address, phoneNumber, name } = req.body;

            const updatedInfo = await Information.findOneAndUpdate(
                { userId, _id: inforId }, // Điều kiện tìm kiếm
                { $set: { address, phoneNumber, name } }, // Cập nhật
                { new: true, upsert: true } // Trả về bản ghi đã cập nhật hoặc tạo mới nếu chưa có
            );

            return res.status(200).json({ message: "Cập nhật thông tin thành công", data: updatedInfo });
        } catch (error) {
            console.error("Lỗi cập nhật thông tin:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Thêm thông tin mới
    addInfor: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { address, phoneNumber, name } = req.body;

            const info = new Information({ address, phoneNumber, name, userId });
            await info.save(); // Lưu vào database

            return res.status(201).json({ message: "Thêm thông tin thành công", data: info });
        } catch (error) {
            console.error("Lỗi thêm thông tin:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    // Xóa thông tin người dùng
    deleteInformation: async (req, res) => {
        try {
            const userId = req.user.userId;
            const informationId = req.params.id;

            // Kiểm tra ID hợp lệ
            if (!mongoose.Types.ObjectId.isValid(informationId)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const info = await Information.findOneAndDelete({ userId, _id: informationId });

            if (!info) {
                return res.status(404).json({ message: "Không tìm thấy thông tin để xóa" });
            }

            return res.status(200).json({ message: "Xóa thông tin thành công" });
        } catch (error) {
            console.error("Lỗi xóa thông tin:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
};

module.exports = InformationController;
