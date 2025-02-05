const bcrypt = require('bcrypt');
const  jwt = require('jsonwebtoken')
const {User, Information} = require("../models/userModel");
const UserController = {
    getUsers : async (req, res) => {
        try{
            const user = await User.find({}).populate("information");
            return res.status(200).json({message : 'Lấy thông tin người dùng thành công',data: user});

        }catch (err){
            console.log("Lấy dữ liệu người dùng thất bại"+err.message);
            return res.status(500).json({message : 'Lấy thông tin người dùng thất bại',error : err.message});

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