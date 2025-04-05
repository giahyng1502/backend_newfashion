const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const { User } = require("../models/userModel");
const cors = require("cors");
const {
  ConversationModel,
  MessageModel,
} = require("../models/conversationModel");
const getConversation = require("../helper/getConversation");

const app = express();
app.use(cors());

/***socket connection */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
global.io = io;
//online user
const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("connect User ", socket.id);

  const userId = socket.handshake.auth.userId;

  //current user details

  //create a room
  socket.join(userId?.toString());
  onlineUser.add(userId?.toString());
  /// get dữ liệu người dùng đang online
  io.emit("onlineUser", Array.from(onlineUser));

  // lấy tin nhắn chi tiết giữa người dùng
  socket.on("message-page", async (receiverId) => {
    // console.log("receiverId : ", receiverId);
    const userDetails = await User.findById(receiverId).select("name avatar");

    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      avatar: userDetails?.avatar,
      online: onlineUser.has(receiverId),
    };
    // console.log(payload);
    // lấy thông tin người dùng
    socket.emit("message-user", payload);

    //get previous message
    // const getConversationMessage = await ConversationModel.findOne({
    //   $or: [
    //     { sender: userId, receiver: receiverId },
    //     { sender: receiverId, receiver: userId },
    //   ],
    // })
    /// trả tin nhắn chi tiết giữa người dùng
    // const message = await MessageModel.find({conversationId : getConversationMessage._id}).limit(10).sort({ createdAt: -1 })
    // socket.emit("message", message || []);
  });

  //gửi tin nhắn mới
  socket.on("new message", async (data) => {
    // kiểm tra conversation có tồn tại không
    console.log(data);
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: data?.sender, receiver: data?.receiver },
        { sender: data?.receiver, receiver: data?.sender },
      ],
    });

    //nếu conversation không tồn tại tạo mới
    if (!conversation) {
      const createConversation = await ConversationModel({
        sender: data?.sender,
        receiver: data?.receiver,
      });
      conversation = await createConversation.save();
    }
    
    const message = new MessageModel({
      text: data.text,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      conversationId : conversation._id,
      msgByUserId: data?.msgByUserId,
    });
    const saveMessage = await message.save();
    console.log(saveMessage);
    // lấy lại ConversationModel

    // gửi đến nhóm chứa id người dùng
    io.to(data?.sender).emit("message", saveMessage || []);
    io.to(data?.receiver).emit(
      "message",
        saveMessage || []
    );

    //gửi conversation
    const conversationSender = await getConversation(data?.sender);
    const conversationReceiver = await getConversation(data?.receiver);
    // gửi danh sách tin nhắn mà người dùng đã nhắn tin kèm những tin nhắn chưa xem
    io.to(data?.sender).emit("conversation", conversationSender);
    io.to(data?.receiver).emit("conversation", conversationReceiver);
  });

  //lấy danh sách những người đã nhắn tin và số lượng tin nhắn chưa đọc
  socket.on("sidebar", async (currentUserId) => {
    console.log("current user", currentUserId);

    const conversation = await getConversation(currentUserId);

    socket.emit("conversation", conversation);
  });
  // khi người dùng vào tin nhắn chi tiết sẽ gọi hàm này để set trang thại tin nhắn về đã đọc
  socket.on("seen", async (msgByUserId) => {
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: userId, receiver: msgByUserId },
        { sender: msgByUserId, receiver: userId },
      ],
    });
    if (!conversation) {
      conversation = new ConversationModel({sender : userId, receiver: msgByUserId});
    }
    const conversationId = conversation._id || "";

    const updateMessages = await MessageModel.updateMany(
        { conversationId: conversationId, msgByUserId: msgByUserId },
        { $set: { seen: true } }
    );

    //gửi lại conversation
    const conversationSender = await getConversation(userId?.toString());
    const conversationReceiver = await getConversation(msgByUserId);

    io.to(userId?.toString()).emit("conversation", conversationSender);
    io.to(msgByUserId).emit("conversation", conversationReceiver);
  });

  //disconnect
  socket.on("disconnect", () => {
    //khi người dùng ngắn kết nối sẽ xóa người dùng khỏi danh sách online
    onlineUser.delete(userId?.toString());
    console.log("disconnect user ", socket.id);
  });
});

module.exports = {
  app,
  server,
};
