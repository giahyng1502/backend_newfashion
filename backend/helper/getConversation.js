const { ConversationModel, MessageModel } = require("../models/conversationModel");

const getConversation = async (currentUserId) => {
  if (!currentUserId) {
    return [];
  }

  try {
    // Lấy danh sách cuộc hội thoại của người dùng hiện tại
    const currentUserConversations = await ConversationModel.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    }).sort({ createdAt: -1 }).populate("sender","name avatar").populate("receiver","name avatar");

    // Duyệt qua từng cuộc hội thoại để lấy số tin nhắn chưa xem và tin nhắn cuối cùng
    const conversationsWithLastMsg = await Promise.all(
        currentUserConversations.map(async (conv) => {
          // Lấy tin nhắn cuối cùng của cuộc hội thoại
          const lastMessage = await MessageModel.findOne({ conversationId: conv._id })
              .sort({ createdAt: -1 })
              .lean();

          // Đếm số tin nhắn chưa đọc trong cuộc hội thoại
          const unseenMsgCount = await MessageModel.countDocuments({
            conversationId: conv._id,
            seen: false,
            msgByUserId: { $ne: currentUserId }, // Chỉ đếm tin nhắn của người khác gửi chưa đọc
          });

          return {
            _id: conv._id,
            sender: conv.sender,
            receiver: conv.receiver,
            unseenMsg: unseenMsgCount,
            lastMsg: lastMessage || null, // Nếu không có tin nhắn nào thì null
          };
        })
    );

    return conversationsWithLastMsg;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
};

module.exports = getConversation;
