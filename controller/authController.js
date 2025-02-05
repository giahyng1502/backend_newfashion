const OTP = require("../models/otpModel");
const { sendOTP } = require("../service/emailService");
const crypto = require("crypto");
const {User} = require("../models/userModel");
const bcrypt = require("bcrypt");

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
        const { email, otp } = req.body;
        console.log(email)
        const validOTP = await OTP.findOne({ email, otp });

        if (!validOTP) return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });

        // Xóa OTP sau khi xác thực
        await OTP.deleteOne({ _id: validOTP._id });

        res.json({ message: "Xác thực thành công! Bạn có thể đặt lại mật khẩu." });
    } catch (error) {
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
