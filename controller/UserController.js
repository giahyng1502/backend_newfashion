const bcrypt = require('bcrypt');
const {User} = require("../models/userModel");
const {uploadImage} = require("../lib/cloudflare");
const generateJwtToken = require("../lib/generateJwtToken");
const admin = require("../firebase/config");
const UserController = {
    getUsers: async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;
            let skip = (page - 1) * limit;

            // Lấy danh sách user theo phân trang
            const users = await User.find({})
                .populate("information")
                .skip(skip).select('-password')
                .limit(limit);

            // Tính tổng số user để biết tổng số trang
            const totalUsers = await User.countDocuments({});
            return res.status(200).json({
                message: "Lấy thông tin người dùng thành công",
                data: users,
                totalUsers: totalUsers,
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
    searchUsers: async (req, res) => {
        try {
            const {name, email, id} = req.query; // Lấy tham số tìm kiếm từ query

            if (!name && !email && !id) {
                return res.status(400).json({message: "Vui lòng nhập từ khóa tìm kiếm"});
            }

            let query = {};

            // Nếu có ID và ID hợp lệ, tìm theo ID trước
            if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = id;
            }

            // Nếu có name, tìm theo name (không phân biệt hoa thường)
            if (name) {
                query.name = {$regex: name, $options: "i"};
            }

            // Nếu có email, tìm theo email (chính xác)
            if (email) {
                query.email = email;
            }

            // Tìm kiếm người dùng với điều kiện trên
            const users = await User.find(query);

            if (users.length === 0) {
                return res.status(404).json({message: "Không tìm thấy người dùng"});
            }

            return res.status(200).json({users});
        } catch (err) {
            console.error("Lỗi server:", err.message);
            return res.status(500).json({message: "Lỗi server"});
        }
    },
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;
            const normalizedEmail = email.toLowerCase(); // Chuyển email thành chữ thường

            let user = await User.findOne({email: normalizedEmail});
            if (!user) {
                const hashPass = await bcrypt.hash(password, 12);

                user = new User({name, email: normalizedEmail, password: hashPass});
                const saveUser = await user.save();
                if (!saveUser) {
                    return res.status(400).json({message: 'Tạo tài khoản thất bại'})
                }
                const userCheck = await User.findOne({email: email});
                if (user) {
                    const token = generateJwtToken(user)
                    return res.status(200).json({message: 'Đăng nhập thành công', token: token, data: userCheck});
                }
            }
            return res.status(400).json({message: 'Email này đã tồn tại trên hệ thống'});

        } catch (err) {
            console.log("Tạo tài khoản thất bại " + err.message);
            return res.status(500).json({message: "Lỗi server", error: err.message});
        }
    },
    updateUser: async (req, res) => {
        try {
            const userId = req.user.userId;
            const {name, password} = req.body;
            const files = req.files;

            if (!userId) {
                return res.status(400).json({message: "Bạn cần đăng nhập để thực hiện chức năng này"});
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
                return res.status(404).json({message: "Cập nhật thông tin người dùng thất bại"});
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

    adminUpdateUser: async (req, res) => {
        try {
            const userId = req.params.id;
            const {name, email, password, point, balance, role} = req.body;

            // Kiểm tra user có tồn tại không
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({message: "Người dùng không tồn tại"});
            }

            let hashPass = user.password; // Giữ nguyên mật khẩu cũ
            if (password) {
                hashPass = await bcrypt.hash(password, 12); // Chỉ hash nếu có mật khẩu mới
            }

            // Cập nhật user
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    name,
                    email,
                    password: hashPass,
                    point,
                    balance,
                    role,
                },
                {new: true} // Trả về bản ghi sau khi cập nhật
            );

            return res.status(200).json({
                message: "Cập nhật người dùng thành công",
                user: updatedUser,
            });
        } catch (err) {
            console.error("Lỗi server:", err.message);
            return res.status(500).json({message: err.message});
        }
    },
    getUserByEmail: async (req, res) => {
        try {
            const user = await User.findOne({email: req.body.email}).select('name avatar');
            if (!user) {
                return res.status(401).json({message: "Người dùng không tồn tại"});
            }
            const {_id, ...currentUser} = user._doc;
            return res.status(200).json({message: 'Vui lòng nhập mật khẩu để hoàn tất đăng nhập', data: currentUser});
        } catch (err) {
            console.log("lỗi sever " + err.message)
            return res.status(500).json({message: err.message});
        }
    },
    getMe: async (req, res) => {
        try {
            const id = req.user.userId;
            const user = await User.findOne({_id: id}).populate('information').select('-password -role')
            if (!user) {
                return res.status(401).json({message: 'Người dùng không tồn tại'});
            }
            return res.status(200).json({message: 'lấy dữ liệu người dùng thành công', data: user});
        } catch (err) {
            console.log(err);

            return res.status(500).json({message: err.message});
        }

    },
    login: async (req, res) => {
        try {
            const {email, password} = req.body;
            let user = await User.findOne({email: email});
            if (!user) {
                return res.status(404).json({message: 'Tài khoản này không tồn tại trên sever'})
            }
            // kiểm tra mật khẩu
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return res.status(401).json({message: 'Thông tin tài khoản hoặc mật khẩu không chính xác'});
            }
            // tạo JWT
            const token = generateJwtToken(user)
            return res.status(200).json({message: 'Đăng nhập thành công', token: token});
        } catch (e) {
            console.log("Đăng nhập xẩy ra lỗi " + e.message);
            return res.status(500).json({message: 'Lỗi sever ', error: e.message});
        }
    },
    loginWithGoogle: async (req, res) => {
        try {
            const { uid, email, name, picture } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Không thể đăng nhập bằng tài khoản Google không có email" });
            }
            if (!uid) {
                return res.status(400).json({ message: "Bạn cần phải gửi uid" });
            }
            let user = await User.findOne({ uId: uid });

            if (!user) {
                user = new User({
                    uId: uid,
                    email,
                    password: "hungcy",
                    name,
                    avatar: picture
                });
                await user.save(); // Lưu user mới vào database
                console.log('Tạo tài khoản mới:', user);
            }
            const token = generateJwtToken(user);

            return res.status(200).json({
                message: "Đăng nhập thành công",
                token,
            });

        } catch (err) {
            console.log("Lỗi đăng nhập Google:", err);
            return res.status(500).json({ message: err.message });
        }
    },
}
module.exports = UserController;