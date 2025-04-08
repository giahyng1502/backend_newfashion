const mongose = require('mongoose');
const dotenv = require('dotenv').config();
mongose.connect(process.env.DATA_BASE_URL)
    .then(()=> console.log("Kết nối đến database thành công"))
    .catch((err)=>console.log(err));
