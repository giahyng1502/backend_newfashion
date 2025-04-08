require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");

// Khởi tạo S3 Client cho Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_R2,
    secretAccessKey: process.env.SECRET_R2,
  },
});

// Cấu hình Multer để lưu file vào bộ nhớ tạm
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 50MB
});

// Hàm upload file (hỗ trợ cả ảnh & video) lên Cloudflare R2
const uploadImage = async (files) => {
  try {
    const fileUrls = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;

      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype, // Giữ nguyên loại file (image/video)
      };

      // Gửi file lên Cloudflare R2
      await s3.send(new PutObjectCommand(uploadParams));

      // URL file sau khi upload
      const fileUrl = `${process.env.R2_BUCKET_URL}/${fileName}`;
      fileUrls.push(fileUrl);
    }

    return fileUrls;
  } catch (error) {
    console.error("Lỗi upload file:", error.message);
    throw new Error("Không thể upload file lên Cloudflare R2!");
  }
};

module.exports = { s3, upload, uploadImage };
