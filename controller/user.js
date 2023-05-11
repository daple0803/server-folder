import { asyncError } from "../middlewares/error.js"
import { User } from "../models/user.js"
import ErrorHandler from "../utils/error.js"
import {
    cookieOptions,
    getDataUri,
    sendEmail,
    sendToken,
} from "../utils/features.js"
import cloudinary from "cloudinary"

export const login = asyncError(async (req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        return res
            .status(400)
            .json({ success: false, message: "Email hoặc mật khẩu không đúng" })
    }

    if (!password) return next(new ErrorHandler("Vui lòng nhập mật khẩu", 400))

    //Handler Error
    const isMatched = await user.comparePassword(password)
    if (!isMatched) {
        return next(new ErrorHandler("Email hoặc mật khẩu không đúng", 400))
    }

    sendToken(user, res, `Chào mừng ${user.name}`, 200)
})

export const signup = asyncError(async (req, res, next) => {
    const { name, email, password, address, city, country, pinCode } = req.body
    let user = await User.findOne({ email: email })

    if (user) return next(new ErrorHandler("Người dùng đã tồn tại!", 400))
    // req.file

    let avatar = undefined

    if (req.file) {
        const file = getDataUri(req.file)
        const myCloud = await cloudinary.v2.uploader.upload(file.content)
        avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    }

    user = await User.create({
        avatar,
        name,
        email,
        password,
        address,
        city,
        country,
        pinCode,
    })

    sendToken(user, res, "Đăng kí thành công!", 201)
})

export const logOut = asyncError(async (req, res, next) => {
    res.status(200)
        .cookie("token", "", {
            ...cookieOptions,
            expires: new Date(Date.now()),
        })
        .json({
            success: true,
            message: "Đăng xuất thành công!",
        })
})

export const getMyProfile = asyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id)

    res.status(200).json({
        success: true,
        user,
    })
})

export const updateProfile = asyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id)

    const { name, email, address, city, country, pinCode } = req.body

    if (name) user.name = name
    if (email) user.email = email
    if (address) user.address = address
    if (city) user.city = city
    if (country) user.country = country
    if (pinCode) user.pinCode = pinCode

    await user.save()

    res.status(200).json({
        success: true,
        message: "Cập thông tin thành công!",
    })
})

export const changePassword = asyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password")

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword)
        return next(new ErrorHandler("Vui lòng nhập mật khẩu của bạn!", 400))

    const isMatched = await user.comparePassword(oldPassword)

    if (!isMatched) return next(new ErrorHandler("Mật khẩu cũ chưa đúng", 400))

    user.password = newPassword
    await user.save()

    res.status(200).json({
        success: true,
        message: "Thay đổi mật khẩu thành công!",
    })
})

export const updatePic = asyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id)

    const file = getDataUri(req.file)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    const myCloud = await cloudinary.v2.uploader.upload(file.content)
    user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
    }

    await user.save()

    res.status(200).json({
        success: true,
        message: "Cập nhật ảnh đại diện thành công!",
    })
})

export const forgetpassword = asyncError(async (req, res, next) => {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) return next(new ErrorHandler("Incorrect Email", 404))
    // max,min 2000,10000
    // math.random()*(max-min)+min

    const randomNumber = Math.random() * (999999 - 100000) + 100000
    const otp = Math.floor(randomNumber)
    const otp_expire = 15 * 60 * 1000

    user.otp = otp
    user.otp_expire = new Date(Date.now() + otp_expire)
    await user.save()

    const message = `Mã OTP của bạn là ${otp}.\n Mã sẽ tồn tại trong 15 phút.`
    try {
        await sendEmail("Mã OTP thay đổi mật khẩu", user.email, message)
    } catch (error) {
        user.otp = null
        user.otp_expire = null
        await user.save()
        return next(error)
    }

    res.status(200).json({
        success: true,
        message: `Mã OTP đã được gửi tới email ${user.email}`,
    })
})

export const resetpassword = asyncError(async (req, res, next) => {
    const { otp, password } = req.body

    const user = await User.findOne({
        otp,
        otp_expire: {
            $gt: Date.now(), //Mongoose syntax $gt = greater
        },
    })

    if (!user)
        return next(
            new ErrorHandler("Mã OTP không hợp lệ hoặc đã hết hạn", 400)
        )
    if (!password) return next(new ErrorHandler("Vui lòng nhập mật khẩu", 400))
    user.password = password
    user.otp = undefined
    user.otp_expire = undefined

    await user.save()

    res.status(200).json({
        success: true,
        message: "Thay đổi mật khẩu thành công!",
    })
})
