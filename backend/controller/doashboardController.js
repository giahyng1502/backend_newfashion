const moment = require("moment");
const {Order} = require("../models/orderModel");

const dashboardController = {
    getRevenueStats: async (req, res) => {
        try {
            const { time } = req.query; // Nhận tham số từ query string

            let startDate, previousStartDate, previousEndDate;

            // Xác định khoảng thời gian hiện tại và kỳ trước
            if (time === "today") {
                startDate = moment().startOf("day");
                previousStartDate = moment().subtract(1, "day").startOf("day");
                previousEndDate = moment().subtract(1, "day").endOf("day");
            } else if (time === "week") {
                startDate = moment().startOf("isoWeek");
                previousStartDate = moment().subtract(1, "week").startOf("isoWeek");
                previousEndDate = moment().subtract(1, "week").endOf("isoWeek");
            } else if (time === "month") {
                startDate = moment().startOf("month");
                previousStartDate = moment().subtract(1, "month").startOf("month");
                previousEndDate = moment().subtract(1, "month").endOf("month");
            } else if (time === "year") {
                startDate = moment().startOf("year");
                previousStartDate = moment().subtract(1, "year").startOf("year");
                previousEndDate = moment().subtract(1, "year").endOf("year");
            }

            // Tạo điều kiện truy vấn
            const matchCondition = startDate ? { dateCreated: { $gte: startDate.toDate() } } : {};
            const previousMatchCondition =
                previousStartDate && previousEndDate
                    ? { dateCreated: { $gte: previousStartDate.toDate(), $lte: previousEndDate.toDate() } }
                    : {};

            // 🚀 Tính tổng doanh thu và số đơn hàng kỳ hiện tại
            const currentRevenueData = await Order.aggregate([
                { $match: matchCondition },
                { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, totalOrders: { $sum: 1 } } },
            ]);

            // 📉 Tính tổng doanh thu và số đơn hàng kỳ trước
            const previousRevenueData = await Order.aggregate([
                { $match: previousMatchCondition },
                { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, totalOrders: { $sum: 1 } } },
            ]);

            // 🎯 Lấy giá trị doanh thu kỳ hiện tại và kỳ trước
            const currentRevenue = currentRevenueData.length > 0 ? currentRevenueData[0].totalRevenue : 0;
            const previousRevenue = previousRevenueData.length > 0 ? previousRevenueData[0].totalRevenue : 0;

            // 📊 Tính tỷ lệ tăng trưởng (%)
            let revenueGrowthRate =
                previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : (currentRevenue > 0 ? 100 : 0);

            return res.status(200).json({
                time: time || "all",
                totalRevenue: currentRevenue,
                totalOrders: currentRevenueData.length > 0 ? currentRevenueData[0].totalOrders : 0,
                previousRevenue: previousRevenue,
                revenueGrowthRate: revenueGrowthRate.toFixed(2) + "%", // Format 2 chữ số thập phân
            });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    getOrderStats: async (req, res) => {
        try {
            const { time } = req.query; // Nhận tham số từ query string

            let startDate;
            if (time === "today") startDate = moment().startOf("day");
            else if (time === "week") startDate = moment().startOf("isoWeek");
            else if (time === "month") startDate = moment().startOf("month");
            else if (time === "year") startDate = moment().startOf("year");

            const matchCondition = startDate ? { dateCreated: { $gte: startDate.toDate() } } : {};

            // 📊 Truy vấn tổng số đơn hàng theo trạng thái
            const orderStats = await Order.aggregate([
                { $match: matchCondition },
                { $group: { _id: "$status", total: { $sum: 1 } } },
            ]);

            // 🎯 Định dạng dữ liệu trả về
            const stats = {
                pending: orderStats.find((o) => o._id === 0)?.total || 0, // Chờ xác nhận
                shipping: orderStats.find((o) => o._id === 2)?.total || 0, // Đang vận chuyển
                delivered: orderStats.find((o) => o._id === 3)?.total || 0, // Giao thành công
                canceled: orderStats.find((o) => o._id === 4)?.total || 0, // Hủy đơn hàng
                returned: orderStats.find((o) => o._id === 5)?.total || 0, // Hoàn đơn hàng
            };

            // 📈 Tính tỷ lệ đơn hàng thành công & hủy đơn
            const totalOrders = Object.values(stats).reduce((sum, value) => sum + value, 0);
            const successRate = totalOrders > 0 ? ((stats.delivered / totalOrders) * 100).toFixed(2) + "%" : "0%";
            const cancelRate = totalOrders > 0 ? ((stats.canceled / totalOrders) * 100).toFixed(2) + "%" : "0%";

            return res.status(200).json({
                time: time || "all",
                totalOrders,
                stats,
                successRate,
                cancelRate,
            });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
     getTopSellingProducts : async (req, res) => {
         try {
             // Tính toán tổng số lượng bán và doanh thu từ mỗi sản phẩm
             const topSellingProducts = await Order.aggregate([
                 { $unwind: "$item" }, // Giả sử mỗi đơn hàng có trường 'item' là một mảng chứa các sản phẩm
                 {
                     $group: {
                         _id: "$item.productId", // Nhóm theo productId trong đơn hàng
                         totalSold: { $sum: "$item.quantity" }, // Tổng số lượng bán
                         totalRevenue: { $sum: { $multiply: ["$item.quantity", "$item.price"] } }, // Tổng doanh thu từ sản phẩm
                     },
                 },
                 { $sort: { totalSold: -1 } }, // Sắp xếp theo tổng số lượng bán (giảm dần)
                 { $limit: 5 }, // Chỉ lấy 5 sản phẩm bán chạy nhất
                 {
                     $lookup: {
                         from: "products", // Tên collection sản phẩm
                         localField: "_id",
                         foreignField: "_id",
                         as: "productDetails", // Thông tin chi tiết sản phẩm
                     },
                 },
                 { $unwind: "$productDetails" }, // Giải nén thông tin chi tiết sản phẩm
                 {
                     $project: {
                         productName: "$productDetails.name", // Tên sản phẩm
                         totalSold: 1, // Tổng số lượng bán
                         totalRevenue: 1, // Tổng doanh thu
                         cost: "$productDetails.cost", // Lấy giá cost từ sản phẩm
                     },
                 },
                 {
                     $addFields: {
                         // Tính toán doanh thu sau khi trừ đi giá cost
                         actualRevenue: { $subtract: ["$totalRevenue", { $multiply: ["$cost", "$totalSold"] }] },
                     },
                 },
                 {
                     $project: {
                         productName: 1,
                         totalSold: 1,
                         totalRevenue: 1,
                         cost: 1,
                         actualRevenue: 1, // Doanh thu thực tế sau khi trừ chi phí
                     },
                 },
             ]);

             // Trả về kết quả
             return res.status(200).json({
                 topSellingProducts,
             });
         } catch (error) {
             console.error(error);
             return res.status(500).json({
                 message: "Lỗi server trong khi thống kê sản phẩm bán chạy.",
                 error: error.message,
             });
         }
    }
};

module.exports = dashboardController;
