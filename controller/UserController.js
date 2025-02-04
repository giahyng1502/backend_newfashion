const bcrypt = require('bcrypt');
const  jwt = require('jsonwebtoken')
const {User, Information} = require("../models/userModel");
const UserController = {
    getUsers : async (req, res) => {
        try{
            const user = await User.find({}).populate("information");
            return res.status(200).json(user);
        }catch (err){
            console.log("Lấy dữ liệu người dùng thất bại"+err.message);
        }
    },
    register : async (req, res) => {
        try{
            const {name, email, password} = req.body;
            let user = await User.findOne({email:email});
            if(!user){
                const hashPass = await bcrypt.hash(password,12);

                user = new User({name, email, password : hashPass});
                const saveUser = await user.save();
                return res.status(200).json(saveUser);
            }
            return res.status(400).json("email này đã tồn tại trên hệ thống");
        }catch (err) {
            console.log("Tạo tài khoản thất bại "+ err.message);
            return res.status(404).json("Tạo tài khoản thất bại "+err.message);
        }
    },
    login : async (req, res) => {
        try{
            const {email,password} = req.body;
            let user = await User.findOne({email:email});
            if(!user){
                return res.status(404).json("Tài khoản này không tồn tại trên sever")
            }
            // kiểm tra mật khẩu
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if(!isPasswordMatch){
                return res.status(401).json("Thông tin tài khoản hoặc mật khẩu không chính xác");
            }
            // tạo JWT
            const token = jwt.sign({
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },process.env.JWT_SECRET, {expiresIn: '30d'});
            return res.status(200).json({ token: token });
        }catch (e) {
            console.log("Đăng nhập xẩy ra lỗi "+e.message);
            return res.status(500).json({error: e.message});
        }
    },
    updateUser : async (req, res) => {
        try{
            const {name,avatar,information} = req.body;
            let user = await User.findOne({email:email});
        }
        catch (e){
            console.log("cập nhập người dùng thất bại")
        }
    }
}
module.exports = UserController;