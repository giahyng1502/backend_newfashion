const bcrypt = require('bcrypt');
const  jwt = require('jsonwebtoken')
const {User, Information} = require("../models/userModel");
const {uploadImage} = require("../lib/cloudflare");
const UserController = {
    getUsers: async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;
            let skip = (page - 1) * limit;

            // Lấy danh sách user theo phân trang
            const users = await User.find({})
                .populate("information")
                .skip(skip)
                .limit(limit);

            // Tính tổng số user để biết tổng số trang
            const totalUsers = await User.countDocuments({});
            const totalPages = Math.ceil(totalUsers / limit);

            return res.status(200).json({
                message: "Lấy thông tin người dùng thành công",
                data: users,
                totalPages: totalPages,
                currentPage: page,
            });

        } catch (err) {
            console.log("Lấy dữ liệu người dùng thất bại: " + err.message);
            return res.status(500).json({
                message: "Lấy thông tin người dùng thất bại",
                error: err.message,
            });
        }
    },
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const normalizedEmail = email.toLowerCase(); // Chuyển email thành chữ thường

            let user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                const hashPass = await bcrypt.hash(password, 12);

                user = new User({ name, email: normalizedEmail, password: hashPass });
                const saveUser = await user.save();
                return res.status(200).json({ message: 'Đăng ký tài khoản thành công', data: saveUser });
            }
            return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống' });

        } catch (err) {
            console.log("Tạo tài khoản thất bại " + err.message);
            return res.status(500).json({ message: "Lỗi server", error: err.message });
        }
    },
        updateUser: async (req, res) => {
            try {
                const userId = req.user.userId;
                const { name, password } = req.body;
                const files = req.files;

                if (!userId) {
                    return res.status(400).json({ message: "Bạn cần đăng nhập để thực hiện chức năng này" });
                }

                let userUpdate = {};

                // Upload ảnh nếu có
                if (files && files.length > 0) {
                    const image = await uploadImage(files);
                    if (image && image.length > 0) {
                        userUpdate.avatar = image[0];
                    }
                }

                // Cập nhật name
                if (name) {
                    userUpdate.name = name;
                }

                // Hash mật khẩu trước khi cập nhật
                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    userUpdate.password = await bcrypt.hash(password, salt);
                }

                // Thực hiện cập nhật người dùng
                const updatedUser = await User.findByIdAndUpdate(userId, userUpdate, {
                    new: true, // Trả về bản ghi mới sau khi cập nhật
                });

                if (!updatedUser) {
                    return res.status(404).json({ message: "Cập nhật thông tin người dùng thất bại" });
                }

                return res.status(200).json({
                    message: "Cập nhật thông tin người dùng thành công",
                    data: updatedUser
                });

            } catch (err) {
                console.error("Cập nhật thông tin người dùng thất bại:", err.message);
                return res.status(500).json({
                    message: "Lỗi server",
                    error: err.message
                });
            }
        },


    login : async (req, res) => {
        try{
            const {email,password} = req.body;
            let user = await User.findOne({email:email});
            if(!user){
                return res.status(404).json({message : 'Tài khoản này không tồn tại trên sever'})
            }
            // kiểm tra mật khẩu
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if(!isPasswordMatch){
                return res.status(401).json({message : 'Thông tin tài khoản hoặc mật khẩu không chính xác'});
            }
            // tạo JWT
            const token = jwt.sign({
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },process.env.JWT_SECRET, {expiresIn: '30d'});
            return res.status(200).json({message : 'Đăng nhập thành công', token: token });
        }catch (e) {
            console.log("Đăng nhập xẩy ra lỗi "+e.message);
            return res.status(500).json({message : 'Lỗi sever ',error: e.message});
        }
    },
}
module.exports = UserController;