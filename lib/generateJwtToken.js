const {sign} = require("jsonwebtoken");

const generateJwtToken = (user) => {
    return sign({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role || '0',
    }, process.env.JWT_SECRET, { expiresIn: '30d' });
}
module.exports = generateJwtToken;