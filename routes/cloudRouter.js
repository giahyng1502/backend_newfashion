var express = require("express");
var router = express.Router();
const { upload, uploadImage} = require("../lib/cloudflare");

router.post("/", upload.array("files", 5), async (req, res) => {
  try {
    const file = req.files;
    if (!file) {
        return res.status(401).json({
            message : 'Không tìm thấy file'
        })
    }
    const url = await uploadImage(file);
    return res.status(200).json({
        url : url
    })
  } catch (error) {
    console.error("Lỗi upload hoặc thêm sản phẩm:", error);
    res.status(500).json({
      error: "Có lỗi xảy ra trong quá trình upload hoặc thêm sản phẩm",
    });
  }
});

module.exports = router;
