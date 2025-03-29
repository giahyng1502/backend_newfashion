const generateOrderCode = (userId) => {
    const timestamp = Date.now().toString().slice(-5); // 5 số cuối timestamp
    const randomNum = Math.floor(1000 + Math.random() * 9000).toString(); // 4 số ngẫu nhiên
    const userCode = userId.toString().slice(-1); // 1 số cuối của userId (hoặc ID đơn hàng)
    return timestamp + randomNum + userCode; // Tổng cộng 10 số
};
module.exports = generateOrderCode;