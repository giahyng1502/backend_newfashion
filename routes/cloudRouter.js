var express = require("express");
var router = express.Router();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { Product } = require("../models/productModel");
const s3 = require("../lib/cloudflare");
const { upload } = require("../lib/cloudflare");

router.post("/product", upload.array("files", 5), async (req, res) => {
  // Giới hạn tối đa 5 file
  // Kiểm tra xem có file nào được gửi không
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Không có file nào được chọn" });
  }

  const { name, price, description, size, color } = req.body; // Thông tin sản phẩm gửi kèm từ frontend

  if (!name || !price || !description || !size || !color) {
    return res
      .status(400)
      .json({ error: "Không được bỏ trống tất cả các trường" });
  }

  if (Array.isArray(size) && size.length === 0) {
    return res.status(400).json({ error: "Mảng size không được trống" });
  }

  if (Array.isArray(color) && color.length === 0) {
    return res.status(400).json({ error: "Mảng color không được trống" });
  }

  try {
    // Tải ảnh lên Cloudflare R2
    const imageUrls = [];
    const arrayColors = color.split(",").map((color) => color.trim());
    const sizeColor = size.split(",").map((size) => size.trim());
    for (const file of req.files) {
      const fileName = `${Date.now()}-${file.originalname}`;

      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Gửi ảnh lên Cloudflare R2
      await s3.send(new PutObjectCommand(uploadParams));

      // Tạo URL công khai của ảnh
      const imageUrl = `${process.env.R2_BUCKET_URL}/${fileName}`;
      imageUrls.push(imageUrl);
    }

    // Tạo sản phẩm mới với URL ảnh từ Cloudflare R2
    const newProduct = new Product({
      name,
      price,
      size: sizeColor,
      image: imageUrls, // Lưu nhiều ảnh dưới dạng mảng
      color: arrayColors,
      description,
    });

    // Lưu sản phẩm vào MongoDB
    await newProduct.save();

    // Trả về thông báo thành công
    res.status(201).json({
      message: "Sản phẩm đã được thêm thành công",
      product: newProduct,
    });
  } catch (error) {
    console.error("Lỗi upload hoặc thêm sản phẩm:", error);
    res.status(500).json({
      error: "Có lỗi xảy ra trong quá trình upload hoặc thêm sản phẩm",
    });
  }
});

module.exports = router;
