const mongoose = require("mongoose");
const { Information, User} = require("../models/userModel");

const InformationController = {

    // Cập nhật hoặc thêm mới thông tin người dùng
    upsertInformation: async (req, res) => {
        try {
            const userId = req.user.userId; // ID của user
            const inforId = req.params.inforId; // ID của thông tin (nếu có)
            const { address, phoneNumber, name } = req.body;

            let updatedInfo;

            if (inforId) {
                // Nếu đã có ID => Cập nhật thông tin
                updatedInfo = await Information.findByIdAndUpdate(
                    inforId,
                    { $set: { address, phoneNumber, name } },
                    { new: true } // Trả về bản ghi đã cập nhật
                );
            }

            if (!updatedInfo) {
                // Nếu không tìm thấy thông tin, tạo mới
                updatedInfo = new Information({ address, phoneNumber, name });
                await updatedInfo.save();

                // Cập nhật vào user
                await User.findByIdAndUpdate(
                    userId,
                    { $push: { information: updatedInfo._id } },
                    { new: true }
                );
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


    // Thêm thông tin mới
    addInfor: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { address, phoneNumber, name } = req.body;

            const info = new Information({ address, phoneNumber, name, userId });
            await info.save(); // Lưu vào database
            const updateUser = await User.findByIdAndUpdate(userId,{
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

            const info = await Information.findOneAndDelete({ userId, _id: informationId });

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
