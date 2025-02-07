const jwt = require("jsonwebtoken");

const userMiddle = async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json("Vui lòng đăng nhập để thực hiện chức năng này");
    }
    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET,(err, decoded) => {
      if (err) {
          return res.status(401).json("Phiên đăng nhập của bạn đã kết thúc : "+err.message);
      }
      req.user = decoded;
      next();
    })
}
const verifyAdmin = async (req, res, next) => {
    await userMiddle(req, res,()=> {
        if (req.user.role === 2) {
            next();
        }else {
            return res.status(403).json("Bạn không có quyền truy cập")
        }
    });
}
module.exports = {userMiddle, verifyAdmin};