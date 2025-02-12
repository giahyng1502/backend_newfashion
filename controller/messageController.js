const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getReceiverSocketId, io } = require("../lib/socketConfig");
const { s3 } = require("../lib/cloudflare");
const Message = require("../models/messageModel");
const { User } = require("../models/userModel");

module.exports.getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports.getSenderOfUser = async (req, res) => {
  try {
    const myId = req.user.userId;

    // Tìm tất cả các tin nhắn mà người dùng tham gia (là sender hoặc receiver)
    let messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    }).sort({ createdAt: -1 }); // Sắp xếp theo thời gian giảm dần

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: "No messages found" });
    }

    // Sử dụng Set để đảm bảo các partner không bị lặp lại
    const partnerIds = new Set();

    messages.forEach((message) => {
      // Nếu người dùng là sender, đối tác là receiverId; nếu không, đối tác là senderId
      if (message.senderId.toString() === myId) {
        partnerIds.add(message.receiverId.toString());
      } else {
        partnerIds.add(message.senderId.toString());
      }
    });

    // Lấy thông tin chi tiết của các đối tác đã nhắn tin
    const partners = await User.find({
      _id: { $in: Array.from(partnerIds) },
    }).select("name avatar");

    // Trả về danh sách các đối tác với thông tin tên, avatar và tin nhắn cuối cùng
    const result = partners.map((partner) => {
      // Lấy tin nhắn mới nhất với đối tác này
      const lastMessage = messages.find(
        (message) =>
          (message.senderId.toString() === partner._id.toString() ||
            message.receiverId.toString() === partner._id.toString()) &&
          (message.senderId.toString() === myId ||
            message.receiverId.toString() === myId)
      );
      return {
        partnerId: partner._id,
        partnerName: partner.name,
        partnerAvatar: partner.avatar,
        lastMessage: lastMessage.text, // Lấy nội dung tin nhắn mới nhất
        lastMessageCreatedAt: lastMessage.createdAt, // Thời gian của tin nhắn mới nhất
      };
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error in getSenderOfUser:", error.message);
    return res.status(500).json({ error: "Internal server error" });
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

    res
      .status(200)
      .json({ data: messages, messages: "Lấy dữ liệu tin nhắn thành công" });
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
    let imageUrls = [];

    if (req.files || req.files.length > 0) {
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
