const {
  MessageModel,
  ConversationModel,
} = require("../models/conversationModel");

const messageController = {
   createMessage : async (req, res) =>{
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
  },
   getMessage : async (req, res) => {
    try {
      const receiver = req.params.receiver;
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0; // Xử lý offset mặc định = 0 nếu không có

      let conversation = await ConversationModel.findOne({
        $or: [
          { sender: userId, receiver: receiver },
          { sender: receiver, receiver: userId },
        ],
      });
      if (!conversation) {
        conversation = new ConversationModel({sender : userId, receiver: receiver});
      }
      const messages = await MessageModel.find({ conversationId : conversation._id }) // Lọc theo conversationId
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset);
      const message = messages.reverse();
      res.status(200).json({ messages:message });
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: err.message });
    }
  }

}
module.exports = messageController;
