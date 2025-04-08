const Notify = require("../models/notificationModel");
const notificationController = {
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.userId; // Lấy userId từ token
            const notifications = await Notify.find({ userId }).sort({ createdAt: -1 });

            return res.status(200).json({ message: "Lấy thông báo thành công", data: notifications });
        } catch (e) {
            console.log("Lỗi khi lấy thông báo:", e);
            return res.status(500).json({ message: "Lỗi server", error: e.message });
        }
    }

}
module.exports = notificationController