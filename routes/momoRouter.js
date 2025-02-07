var express = require("express");
var router = express.Router();
const { default: axios } = require("axios");
const crypto = require("crypto");

/* POST payment initiation */
router.post("/payment", async function (req, res, next) {
  const { priceProduct,rawOrderId } = req.body;
  const accessKey = process.env.ACCESS_KEY_MOMO;
  const secretKey = process.env.MOMO_SECRET;
  const orderInfo = "pay with MoMo";
  //
  const partnerCode = "MOMO";
  ///redicectUrl : khi thanh toan thanh cong se chuyen den trang do
  const redirectUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
  const ipnUrl = "http://160.30.21.59:3000/momo/callback";
  // var ipnUrl = "https://facebook.com/";
  const requestType = "payWithMethod";
  const amount = priceProduct;
  const orderId = rawOrderId;
  const requestId = rawOrderId;
  const extraData = "";
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
  console.log("--------------------CALLBACK----------------");
  console.log(req.body);
  // Process MoMo callback data here
  //...
  return res.status(200).json(req.body);
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
