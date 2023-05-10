import mongoose from "mongoose"
import validator from "validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const schema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, "Vui lòng nhập tên của bạn"],
    },

    email: {
        type: String,
        require: [true, "Vui lòng nhập email của bạn"],
        unique: [true, "Email đã tồn tại"],
        validate: validator.isEmail,
    },

    password: {
        type: String,
        require: [true, "Vui lòng nhập mật khẩu của bạn"],
        minLength: [6, "Mật khẩu cần có ít nhất 6 kí tự!"],
        select: false,
    },

    address: {
        type: String,
        require: true,
    },

    city: {
        type: String,
        require: true,
    },

    country: {
        type: String,
        require: true,
    },

    pinCode: {
        type: Number,
        require: true,
    },

    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },

    avatar: {
        public_id: String,
        url: String,
    },

    otp: Number,
    otp_expire: Date,
})

//Schema là một object do đó this.pasword sẽ chỉ tới pasword được lưu trong db
//Methods save sẽ kiểm tra để hashcode mật khẩu
schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
})

//Hàm đối chiếu mật khẩu
schema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

//Hàm kiểm tra mật khẩu
schema.methods.generateToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    })
}

export const User = mongoose.model("User", schema)
