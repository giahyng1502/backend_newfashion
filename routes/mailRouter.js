const express = require('express');
const { sendMail } = require('../service/emailService'); // ✅ Import đúng

const router = express.Router();

router.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    try {
        await sendMail(to, subject, text);
        res.status(200).json({ message: 'Email đã gửi thành công!' });
    } catch (error) {
        res.status(500).json({ error: 'Gửi email thất bại' });
    }
});

module.exports = router;
