const OTP = require("../models/otpModel");
const { sendOTP } = require("../service/emailService");
const crypto = require("crypto");
const {User} = require("../models/userModel");
const bcrypt = require('bcryptjs');


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });
        const user = User.findOne({email : email});
        if (!user) {
            if (!email) return res.status(404).json({ message: "Tài khoản này không tồn tại trên hệ thống" });
        }
        // Tạo mã OTP 6 chữ số
        const otp = crypto.randomInt(100000, 999999).toString();

        // Lưu OTP vào database
        await OTP.create({ email, otp });

        // Gửi OTP qua email
        await sendOTP(email, otp);

        res.json({ message: "Mã OTP đã gửi tới email của bạn." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi gửi OTP", error: error.message });
    }
};
    exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const validOTP = await OTP.findOne({ email: normalizedEmail, otp });

        if (!validOTP) {
            return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        const updateUser = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { password: hashedPassword },
            { new: true }
        );

        if (updateUser) {
            await OTP.deleteOne({ _id: validOTP._id });
            return res.json({ message: "Đặt lại mật khẩu thành công" });
        } else {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi xác thực OTP", error: error.message });
    }
};



exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Cập nhật mật khẩu
        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        res.json({ message: "Mật khẩu đã được đặt lại thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi đặt lại mật khẩu", error: error.message });
    }
};
