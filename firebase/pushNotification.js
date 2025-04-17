const {Device} = require("../models/userModel");
const admin = require("./config");

const sendNotification = async (req,res) => {
    try {
        // Tìm deviceToken của user trong DB
        const {userId,title,body} = req.body;
        const device = await Device.findOne({ userId });

        if (!device || !device.deviceToken.length) {
            console.log('Không tìm thấy device token cho user');
            return res.status(401).json({message : 'Không tìm thấy device token cho user'})
        }

        // Duyệt qua tất cả các deviceToken và gửi thông báo
        const tokens = device.deviceToken;

        // Tạo thông báo
        const message = {
            data: {
                title: title,
                body: body,
            },
            tokens: tokens,  // Gửi đến nhiều thiết bị
            android: {
                priority: 'high',
            }
        };

        // Gửi thông báo qua FCM
        const response = await admin.messaging().sendEachForMulticast(message);
        response.responses.forEach((res, index) => {
            if (!res.success) {
                console.log(`❌ Error for token ${message.tokens[index]}:`, res.error.message);
            }
        });
        return res.status(201).json({message : response})

    } catch (error) {
        console.error("Lỗi gửi thông báo:", error);
    }
};

const sendNotificationToUser = async ({userId, title, body}) => {
    try {
        // Tìm deviceToken của user trong DB
        const device = await Device.findOne({ userId });

        if (!device || !device.deviceToken.length) {
            console.log('Không tìm thấy device token cho user');
        }

        // Duyệt qua tất cả các deviceToken và gửi thông báo
        const tokens = device.deviceToken;

        // Tạo thông báo
        const message = {
            data: {
                title: title,
                body: body,
            },
            tokens: tokens,
            android: {
                priority: 'high',
            }
        };

        // Gửi thông báo qua FCM
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log("Gửi thông báo thành công:", response);

    } catch (error) {
        console.error("Lỗi gửi thông báo:", error);
    }
};
module.exports = {sendNotificationToUser, sendNotification};