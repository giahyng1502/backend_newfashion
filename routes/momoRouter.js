var express = require("express");
var router = express.Router();
const { default: axios } = require("axios");
const crypto = require("crypto");
const {Payment, Order} = require("../models/orderModel");
const {sendMail} = require("../service/emailService");
const {User} = require("../models/userModel");

/* POST payment initiation */
router.post("/payment", async function (req, res, next) {
  const { priceProduct,rawOrderId,idOrder} = req.body;
  const accessKey = process.env.ACCESS_KEY_MOMO;
  const secretKey = process.env.MOMO_SECRET;
  const orderInfo = "pay with MoMo";
  //
  const partnerCode = "MOMO";
  ///redicectUrl : khi thanh toan thanh cong se chuyen den trang do
  const redirectUrl = "newfashion--android://orderdone";
  const ipnUrl = "https://api.hungcy.id.vn/momo/callback";
  const requestType = "payWithMethod";
  const amount = priceProduct;
  const orderId = rawOrderId;
  const requestId = rawOrderId;
  const extraData = idOrder;
  const orderGroupId = "";
  const autoCapture = true;
  const lang = "vi";

  // Raw signature string
  var rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  //   console.log("--------------------RAW SIGNATURE----------------");
  //   console.log(rawSignature);

  // Generate HMAC SHA256 signature
  var signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  console.log("--------------------SIGNATURE----------------");
  console.log(signature);

  // Prepare JSON object to send to MoMo API
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  // Axios request options
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };

  try {
    // Send request to MoMo API
    const result = await axios(options);
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: "Server error: " + error.message });
  }
});
router.post("/callback", async (req, res) => {
  try {
    console.log("--------------------CALLBACK----------------");
    console.log(req.body);

    const {
      orderId,
      transId,
      requestId,
      payType,
      orderType,
      amount,
      extraData,
      resultCode,
      message,
    } = req.body;

    // 1. Tìm đơn hàng theo orderCode
    const order = await Order.findById(extraData);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // 2. Lưu thông tin thanh toán
    const paymentData = {
      orderId: order._id, // Lưu ObjectId thật sự
      transId,
      requestId,
      payType,
      orderType,
      amount,
      isPaid: resultCode === 0,
      resultCode,
      message,
      responseTime: new Date(),
    };

    const newPayment = await Payment.create(paymentData);
    console.log(newPayment)
    // 3. Cập nhật đơn hàng là đã thanh toán (nếu cần)
    if (resultCode === 0) {
      order.paymentId = newPayment._id;
      order.paymentMethod = 'momo'; // nếu là thanh toán momo
      order.status = 1; // ví dụ: chờ giao hàng
      order.statusHistory.push({
        status: 7,
        updatedBy : order.userId
      })
      await order.save();
      const user = await User.findById(order.userId)
      await sendMail(
          user?.email,
          'Hóa đơn thanh toán',
          'Cảm ơn bạn đã đặt hàng tại NewFashion!',
          order.items,
          amount
      );
    }
    return res.status(200).json({ message: "OK", payment: newPayment });
  } catch (e) {
    console.log("Lỗi khi xử lý callback MoMo:", e);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/transaction", async (req, res) => {
  const { orderId } = req.body;
  console.log(orderId);
  try {
    var accessKey = process.env.ACCESS_KEY_MOMO;
    var secretKey = process.env.MOMO_SECRET;
    var partnerCode = "MOMO";
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${orderId}`;
    var signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    var requestBody = JSON.stringify({
      partnerCode: partnerCode,
      orderId: orderId,
      requestId: orderId,
      signature: signature,
      lang: "vi",
    });

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/query",
      headers: {
        "Content-Type": "application/json",
      },
      data: requestBody,
    };
    const result = await axios(options);
    return res.status(200).json(result.data);
  } catch (error) {
    console.log("Lỗi lỗi xẩy ra khi lấy kết quả thanh toán" + error.message);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
});
module.exports = router;
