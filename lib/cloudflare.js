// Khởi tạo S3 Client cho Cloudflare R2
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPORT,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_R2,
        secretAccessKey: process.env.SECRET_R2,
    },
});

// Cấu hình Multer để lưu ảnh vào bộ nhớ tạm
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { s3, upload };
