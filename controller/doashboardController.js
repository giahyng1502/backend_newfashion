const moment = require("moment");
const {Order} = require("../models/orderModel");
const {Product} = require("../models/productModel");
const {User} = require("../models/userModel");

const dashboardController = {
    getRevenueStats: async (req, res) => {
        try {
            const { time } = req.query;
            const now = moment();

            let startDate, endDate, format;
            const labels = [];

            if (time === "week") {
                startDate = now.clone().startOf("isoWeek");
                endDate = now.clone().endOf("isoWeek");
                format = "%d-%m-%Y";

                const current = startDate.clone();
                while (current.isSameOrBefore(endDate)) {
                    labels.push(current.format("DD-MM-YYYY"));
                    current.add(1, "day");
                }

            }else if (time === "month") {
                startDate = now.clone().startOf("month");
                endDate = now.clone().endOf("month");
                format = "Week %V-%G"; // ISO Week format

                const current = startDate.clone().startOf("isoWeek");
                while (current.isSameOrBefore(endDate)) {
                    labels.push(`Week ${current.isoWeek()}-${current.isoWeekYear()}`);
                    current.add(1, "week");
                }

            } else if (time === "year") {
                startDate = now.clone().startOf("year");
                endDate = now.clone().endOf("year");
                format = "%m-%Y";

                const current = startDate.clone();
                while (current.isSameOrBefore(endDate)) {
                    labels.push(current.format("MM-YYYY"));
                    current.add(1, "month");
                }
            } else {
                return res.status(400).json({ message: "Giá trị 'time' không hợp lệ (chỉ nhận: week, month, year)" });
            }

            // Truy vấn dữ liệu từ MongoDB
            const currentData = await Order.aggregate([
                {
                    $match: {
                        dateCreated: {
                            $gte: startDate.toDate(),
                            $lte: endDate.toDate()
                        },
                        status: 3
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format, date: "$dateCreated" } },
                        totalRevenue: { $sum: "$totalPrice" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);
            // Map dữ liệu theo nhãn thời gian
            const dataMap = {};
            currentData.forEach(item => {
                dataMap[item._id] = {
                    label: item._id,
                    totalRevenue: item.totalRevenue,
                    totalOrders: item.totalOrders
                };
            });

            const responseData = labels.map(label => ({
                label,
                totalRevenue: dataMap[label]?.totalRevenue || 0,
                totalOrders: dataMap[label]?.totalOrders || 0
            }));

            return res.status(200).json({
                time,
                from: startDate.format("DD-MM-YYYY"),
                to: endDate.format("DD-MM-YYYY"),
                data: responseData
            });

        } catch (error) {
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    getOrderStats: async (req, res) => {
        try {
            const { time } = req.query;

            let startDate, endDate;
            if (time === "today") {
                startDate = moment().startOf("day");
                endDate = moment().endOf("day");
            } else if (time === "week") {
                startDate = moment().startOf("isoWeek");
                endDate = moment().endOf("isoWeek");
            } else if (time === "month") {
                startDate = moment().startOf("month");
                endDate = moment().endOf("month");
            } else if (time === "year") {
                startDate = moment().startOf("year");
                endDate = moment().endOf("year");
            }

            const matchCondition = startDate
                ? { dateCreated: { $gte: startDate.toDate(), $lte: endDate.toDate() } }
                : {};

            const orderStats = await Order.aggregate([
                { $match: matchCondition },
                { $group: { _id: "$status", total: { $sum: 1 } } },
            ]);
            console.log(orderStats);
            const stats = {
                pending: orderStats.find((o) => o._id === 0)?.total || 0,
                confirmed: orderStats.find((o) => o._id === 1)?.total || 0,
                shipping: orderStats.find((o) => o._id === 2)?.total || 0,
                delivered: orderStats.find((o) => o._id === 3)?.total || 0,
                canceled: orderStats.find((o) => o._id === 4)?.total || 0,
                returned: orderStats.find((o) => o._id === 5)?.total || 0,
                waitingPayment: orderStats.find((o) => o._id === 6)?.total || 0,
            };

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
    getTopSellingProducts: async (req, res) => {
        try {
            const { time } = req.query;
            const now = new Date();

            let dateFilter = {};

            if (time === "day") {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                dateFilter = { dateCreated: { $gte: start, $lt: end } };
            } else if (time === "month") {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                dateFilter = { dateCreated: { $gte: start, $lt: end } };
            } else if (time === "year") {
                const start = new Date(now.getFullYear(), 0, 1);
                const end = new Date(now.getFullYear() + 1, 0, 1);
                dateFilter = { dateCreated: { $gte: start, $lt: end } };
            } else if (time) {
                return res.status(400).json({ message: "Giá trị 'time' không hợp lệ (chỉ nhận: day, month, year hoặc không truyền gì)" });
            }

            const result = await Order.aggregate([
                { $unwind: "$items" },
                {
                    $match: {
                        status: 3,
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: "$items.productId",
                        totalQuantitySold: { $sum: "$items.quantity" },
                        totalRevenue: { $sum: "$items.total" }
                    }
                },
                { $sort: { totalQuantitySold: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                {
                    $project: {
                        _id: 0,
                        productId: "$product._id",
                        name: "$product.name",
                        image: "$product.image",
                        totalQuantitySold: 1,
                        totalRevenue: 1
                    }
                }
            ]);

            return res.status(200).json({
                time: time || "all",
                topProducts: result
            });

        } catch (err) {
            return res.status(500).json({
                message: "Server Error",
                error: err.message
            });
        }
    },


    // Lấy sản phẩm sắp hết hàng (< 10 sản phẩm còn lại)
     getLowStockProducts : async (req, res) => {
        try {
            const lowStockProducts = await Product.find({
                stock: { $lt: 10 }
            }).select('name image stock sold');

            res.status(200).json({
                success: true,
                data: lowStockProducts
            });
        } catch (err) {
            console.error("Error fetching low stock products:", err);
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    },




     getUserStats : async (req, res) => {
        try {
            const { time } = req.query;

            let startDate, endDate;

            if (time === "today") {
                startDate = moment().startOf("day");
                endDate = moment().endOf("day");
            } else if (time === "week") {
                startDate = moment().startOf("isoWeek");
                endDate = moment().endOf("isoWeek");
            } else if (time === "month") {
                startDate = moment().startOf("month");
                endDate = moment().endOf("month");
            } else if (time === "year") {
                startDate = moment().startOf("year");
                endDate = moment().endOf("year");
            } else {
                // Nếu không có thời gian hợp lệ, mặc định là tháng hiện tại
                startDate = moment().startOf("month");
                endDate = moment().endOf("month");
            }

            const newUsers = await User.countDocuments({
                createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
            });

            const totalAdmin = await User.countDocuments({ role: 2 });
            const totalStaff = await User.countDocuments({ role: 1 });
            const normalUser = await User.countDocuments({ role: 0 });

            const percentageOfTotal = normalUser > 0
                ? ((newUsers / normalUser) * 100).toFixed(2)
                : "0.00";

            return res.status(200).json({
                time: time || "month",
                newUsers,
                totalAdmin,
                totalStaff,
                normalUser,
                userGrowth: {
                    percentageOfTotal: `${percentageOfTotal}%`
                }
            });
        } catch (error) {
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }



};

module.exports = dashboardController;
