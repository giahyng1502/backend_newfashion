const mongoose = require('mongoose');

const informationSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        default: ' ',
    },
    phoneNumber: {
        type: Number,
        required: true,
        default: 0,
    },
    name : {
        type: String,
        required: true,
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: "https://pub-0f02951565a14603816f4ca468c73608.r2.dev/defaul_avt.jpg"
    },
    point: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    role: {
        type: Number,
        required: true,
        default: 0 // 0 = user, 1 = employee, 2 = admin
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    information : [
    {
        type : mongoose.Schema.ObjectId,
        ref: "Information",
        default: []
    }
    ]
}, { timestamps: true });
const Information = mongoose.model('Information', informationSchema);
const User = mongoose.model('User', userSchema);

module.exports = { User, Information };
