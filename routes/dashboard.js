const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/doashboardController");
const {verifyAdmin, verifyAdminOrStaff} = require("../middleware/AuthMiddle");

router.get("/revenue",verifyAdminOrStaff,dashboardController.getRevenueStats)
router.get("/order-stats",verifyAdminOrStaff,dashboardController.getOrderStats)
router.get("/hung",verifyAdminOrStaff,dashboardController.getTopSellingProducts)

module.exports = router;
