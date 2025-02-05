const nodemailer = require('nodemailer');
require('dotenv').config(); // Load biến môi trường từ .env

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendMail = async (to, subject, text) => {
    try {
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                <h1 style="color: #333; text-align: center;">📩 New Fashion</h1>
                <p style="font-size: 16px; color: #555; line-height: 1.5;">${text}</p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://shopzoe.com" style="text-decoration: none;">
                        <button style="background-color: #ff5722; color: white; padding: 12px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                            🛒 Mua sắm ngay
                        </button>
                    </a>
                </div>
                <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">Nếu bạn không yêu cầu email này, vui lòng bỏ qua.</p>
            </div>
        `;

        const info = await transporter.sendMail({
            from: `"NewFashion Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: emailHTML, // ✅ Sử dụng HTML đẹp
        });

        console.log('Email đã gửi thành công: ' + info.response);
        return info;
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw error;
    }
};

const sendOTP = async (to, otp) => {
    const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #333;">🔒 Xác nhận đặt lại mật khẩu</h2>
            <p style="font-size: 16px; color: #555;">Mã xác nhận của bạn:</p>
            <h1 style="text-align: center; font-size: 24px; color: #ff5722;">${otp}</h1>
            <p style="text-align: center; color: #777;">Mã có hiệu lực trong <b>5 phút</b>.</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"NewFashion Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Mã xác nhận đặt lại mật khẩu",
        html: emailHTML
    });
};

module.exports = { sendMail,sendOTP };