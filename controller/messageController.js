const {
  MessageModel,
  ConversationModel,
} = require("../models/conversationModel");

async function createMessage(req, res) {
  try {
    const { text, imageUrl, videoUrl, receiver } = req.body;
    const sender = req.user.userId;

    // Tạo tin nhắn mới
    const newMessage = new MessageModel({
      text,
      imageUrl,
      videoUrl,
      msgByUserId: sender,
    });

    const savedMessage = await newMessage.save();

    // Kiểm tra nếu cuộc trò chuyện đã tồn tại
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    // Nếu không có cuộc trò chuyện, tạo mới
    if (!conversation) {
      conversation = new ConversationModel({
        sender,
        receiver,
        messages: [savedMessage._id],
      });
      await conversation.save();
    } else {
      // Cập nhật cuộc trò chuyện hiện tại với tin nhắn mới
      conversation.messages.push(savedMessage._id);
      await conversation.save();
    }

    // Trả về thông tin tin nhắn và cuộc trò chuyện
    res.status(200).json({ message: savedMessage, conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createMessage };
