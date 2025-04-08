const express = require("express");
const router = express.Router();
const {verifyAdmin, verifyAdminOrStaff, userMiddle} = require("../middleware/AuthMiddle");
const notificationController = require("../controller/notificationController");

router.get("/getAll",userMiddle,notificationController.getNotifications)

module.exports = router;
