const bcrypt = require('bcryptjs');
const {User} = require("../models/userModel");
const {uploadImage} = require("../lib/cloudflare");
const generateJwtToken = require("../lib/generateJwtToken");
const admin = require("../firebase/config");
const UserController = {
    searchUsers: async (req, res) => {
        try {
            let { page = 1, limit = 10, sortField = "createdAt", sortOrder = "desc", search } = req.query;

            // Đảm bảo `page` và `limit` là số nguyên dương
            page = Math.max(1, parseInt(page)) || 1;
            limit = Math.max(1, parseInt(limit)) || 10;

            // Tạo bộ lọc tìm kiếm
            const filter = {};
            if (search && search.trim() !== "") {
                filter.$or = [
                    { email: { $regex: search, $options: "i" } }, // Tìm theo email
                    { name: { $regex: search, $options: "i" } },  // Tìm theo tên
                ];
            }

            // Tạo bộ sắp xếp (ưu tiên `createdAt`)
            const sortOption = {};
            if (sortField === "role") {
                sortOption["role"] = sortOrder === "desc" ? -1 : 1;
                sortOption["createdAt"] = -1; // Sắp xếp phụ theo ngày tạo
            } else {
                sortOption[sortField] = sortOrder === "desc" ? -1 : 1;
            }

            // Đếm tổng số user phù hợp trước khi phân trang
            const totalUsers = await User.countDocuments(filter);

            // Nếu page vượt quá số lượng user có sẵn, điều chỉnh về trang cuối cùng
            const totalPages = Math.ceil(totalUsers / limit);
            if (page > totalPages) page = totalPages || 1;

            const users = await User.find(filter)
                .select("-password")
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            res.status(200).json({
                data: users,
                total: totalUsers,
                totalPages,
                currentPage: page,
                limit,
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;
            const normalizedEmail = email.toLowerCase().trim(); // Chuyển email thành chữ thường

            let user = await User.findOne({email: normalizedEmail});
            if (!user) {
                const hashPass = await bcrypt.hash(password, 12);

                user = new User({name, email: normalizedEmail, password: hashPass});
                const saveUser = await user.save();
                if (!saveUser) {
                    return res.status(400).json({message: 'Tạo tài khoản thất bại'})
                }
                const userCheck = await User.findOne({email: normalizedEmail});
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
            const {name, password,avatar} = req.body;

            if (!userId) {
                return res.status(400).json({message: "Bạn cần đăng nhập để thực hiện chức năng này"});
            }

            let userUpdate = {};

            // Cập nhật name
            if (name) {
                userUpdate.name = name;
            }
            if (avatar) {
                userUpdate.avatar = avatar;
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
            const user = await User.findOne({_id: id}).populate('information').select('-password')
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
            const {email} = req.body;
            const pass = req.body.password;
            let user = await User.findOne({email: email}).lean();
            if (!user) {
                return res.status(404).json({message: 'Tài khoản này không tồn tại trên sever'})
            }
            // kiểm tra mật khẩu
            const isPasswordMatch = await bcrypt.compare(pass, user.password);
            if (!isPasswordMatch) {
                return res.status(401).json({message: 'Thông tin tài khoản hoặc mật khẩu không chính xác'});
            }
            // tạo JWT
            const token = generateJwtToken(user)
            const {password,...rest} = user;
            return res.status(200).json({message: 'Đăng nhập thành công', token: token,user: rest});
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
                await user.save();
                console.log('Tạo tài khoản mới:', user);
            }

            const token = generateJwtToken(user);

            // Chuyển đổi user sang object và xóa trường password
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user: userResponse,
            });

        } catch (err) {
            console.log("Lỗi đăng nhập Google:", err);
            return res.status(500).json({ message: err.message });
        }
    },

}
module.exports = UserController;