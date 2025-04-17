const express = require("express");
const router = express.Router();
const {verifyAdmin, verifyAdminOrStaff, userMiddle} = require("../middleware/AuthMiddle");
const notificationController = require("../controller/notificationController");
const {sendNotification} = require("../firebase/pushNotification");

router.get("/getAll",userMiddle,notificationController.getNotifications)

router.post("/pushNotifyToUser",sendNotification)


module.exports = router;
