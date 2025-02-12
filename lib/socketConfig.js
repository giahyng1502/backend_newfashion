const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.IO với CORS cho phép kết nối từ localhost:3000 (front-end)
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
    },
});

// Lưu trữ các user đang online
const userSocketMap = {}; // {userId: socketId}

// Hàm để lấy socketId của người dùng
const getReceiverSocketId = (userId) => {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    // Lấy userId từ query params của socket
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // Phát sóng danh sách người dùng online tới tất cả các client
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        // Xóa người dùng khỏi userSocketMap khi họ ngắt kết nối
        delete userSocketMap[userId];
        // Phát sóng lại danh sách người dùng online
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Sử dụng CommonJS để xuất các thành phần
module.exports = { io, getReceiverSocketId };
