const nodemailer = require('nodemailer');
require('dotenv').config(); // Load biến môi trường từ .env

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendMail = async (to, subject, text, data, amount) => {
    try {
        // Tạo từng dòng trong bảng HTML từ mảng sản phẩm `data`
        const tableRows = data.map(item => {
            return `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.productName} màu ${item.color.nameColor}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.price.toLocaleString()}₫</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.discountPrice.toLocaleString()}₫</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.total.toLocaleString()}₫</td>
                </tr>
            `;
        }).join('');

        const totalPrice = amount.toLocaleString() + '₫';

        const emailHTML = `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                <h1 style="color: #333; text-align: center;">🧾 Hóa đơn thanh toán</h1>
                <p style="font-size: 16px; color: #555; line-height: 1.5;">Cảm ơn bạn đã mua sắm tại <strong>NewFashion</strong>! Dưới đây là chi tiết đơn hàng của bạn:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #eee; text-align: left;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Sản phẩm</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Số lượng</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Giá gốc</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Giá khuyến mãi(Nếu có)</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 10px;">
                    <p style="font-size: 16px; color: #333;"><strong>Tổng cộng: ${totalPrice}</strong></p>
                </div>
                <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">Nếu bạn không thực hiện giao dịch này, vui lòng bỏ qua email này.</p>
            </div>`;

        const info = await transporter.sendMail({
            from: `"NewFashion Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: emailHTML,
        });

        console.log('✅ Email đã gửi thành công: ' + info.response);
        return info;
    } catch (error) {
        console.error('❌ Lỗi khi gửi email:', error);
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