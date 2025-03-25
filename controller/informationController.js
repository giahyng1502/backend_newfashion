const mongoose = require("mongoose");
const { Information, User} = require("../models/userModel");

const InformationController = {

    // Cập nhật hoặc thêm mới thông tin người dùng
    updateInformation: async (req, res) => {
        try {
            const userId = req.user.userId; // ID của user
            const inforId = req.params.inforId; // ID của thông tin (nếu có)
            const { address, phoneNumber, name } = req.body;

            let updatedInfo;

            if (inforId) {
                // Nếu đã có ID => Cập nhật thông tin
                updatedInfo = await Information.findOneAndUpdate(
                    { user: userId, _id: inforId }, // Tìm kiếm dựa trên userId và inforId
                    { $set: { address, phoneNumber, name } },
                    { new: true } // Trả về bản ghi đã cập nhật
                );
            }

            if (!updatedInfo) {
                return res.status(404).json({ message: "Không tìm thấy thông tin để cập nhật" });
            }

            return res.status(200).json({
                message: "Cập nhật thông tin thành công",
                data: updatedInfo
            });

        } catch (error) {
            console.error("Lỗi cập nhật thông tin:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },

    setDefaultInformation: async (req, res) => {
        try {
            const userId = req.user.userId;
            const inforId = req.params.inforId;

            if (!inforId) {
                return res.status(400).json({ message: "Thiếu thông tin ID" });
            }

            // Bỏ trạng thái mặc định của tất cả thông tin khác của user
            await Information.updateMany({ user: userId }, { $set: { isDefault: false } });

            // Đặt thông tin mới làm mặc định
            const updatedInfo = await Information.findOneAndUpdate(
                { user: userId, _id: inforId },
                { $set: { isDefault: true } },
                { new: true }
            );
            if (!updatedInfo) {
                return res.status(404).json({ message: "Không tìm thấy thông tin cần cập nhật" });
            }

            return res.status(200).json({
                message: "Đặt thông tin mặc định thành công",
                data: updatedInfo
            });

        } catch (e) {
            console.error("Lỗi đặt thông tin mặc định:", e);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    },



    // Thêm thông tin mới
    addInfor: async (req, res) => {
        try {
            const user = req.user.userId;
            const { address, phoneNumber, name } = req.body;

            const info = new Information({ address, phoneNumber, name, user });
            await info.save(); // Lưu vào database
            const updateUser = await User.findByIdAndUpdate(user,{
                $push: { information: info._id }
            })
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
            const informationId = req.params.inforId;

            // Kiểm tra ID hợp lệ
            if (!mongoose.Types.ObjectId.isValid(informationId)) {
                return res.status(400).json({ message: "ID không hợp lệ" });
            }

            const info = await Information.findOneAndDelete({ user : userId, _id: informationId });

            if (!info) {
                return res.status(404).json({ message: "Không tìm thấy thông tin để xóa" });
            }
            const updateUser = await User.findByIdAndUpdate(userId,{
                $pull: { information: informationId }
            })
            return res.status(200).json({ message: "Xóa thông tin thành công" });
        } catch (error) {
            console.error("Lỗi xóa thông tin:", error.message);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
};

module.exports = InformationController;
