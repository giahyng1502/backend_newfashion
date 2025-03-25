const admin = require("./config");

const sendNotification = async (deviceToken, title, body) => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: deviceToken, // Token của thiết bị cần gửi
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Gửi thông báo thành công:", response);
    } catch (error) {
        console.error("Lỗi gửi thông báo:", error);
    }
};

