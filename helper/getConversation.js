const { ConversationModel } = require("../models/conversationModel");

const getConversation = async (currentUserId) => {
  if (currentUserId) {
    // tìm kiếm cuộc hội thoại của người dùng hiện tại
    const currentUserConversation = await ConversationModel.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ updatedAt: -1 })
      .populate("messages")
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar");
    // tính tổng số tin nhắn chưa xem
    const conversation = currentUserConversation.map((conv) => {
      const countUnseenMsg = conv?.messages?.reduce((preve, curr) => {
        const msgByUserId = curr?.msgByUserId?.toString();

        if (msgByUserId !== currentUserId) {
          // nếu id người gửi khác id người dùng hiện tại sẽ tăng lên 1
          return preve + (curr?.seen ? 0 : 1);
        } else {
          return preve;
        }
      }, 0);

      return {
        _id: conv?._id,
        sender: conv?.sender,
        receiver: conv?.receiver,
        unseenMsg: countUnseenMsg,
        // lấy tin nhắn cuối cùng
        lastMsg: conv.messages[conv?.messages?.length - 1],
      };
    });

    return conversation;
  } else {
    return [];
  }
};

module.exports = getConversation;
