const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getReceiverSocketId, io } = require("../lib/socketConfig");
const { s3 } = require("../lib/cloudflare");
const Message = require("../models/messageModel");
const {User} = require("../models/userModel");

module.exports.getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user.userId;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.userId;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        res.status(200).json({data : messages,messages : 'Lấy dữ liệu tin nhắn thành công'});
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.userId;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "Không có file nào được chọn" });
        }
        let imageUrls = [];

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

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrls,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
