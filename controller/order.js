import { Order } from "../models/order.js"
import { Product } from "../models/product.js"
import { asyncError } from "../middlewares/error.js"
import ErrorHandler from "../utils/error.js"
import { stripe } from "../server.js"

export const processPayment = asyncError(async (req, res, next) => {
    const { totalAmount } = req.body

    const { client_secret } = await stripe.paymentIntents.create({
        amount: Number(totalAmount),
        currency: "VND",
    })

    res.status(201).json({
        success: true,
        client_secret,
    })
})

export const creatOrder = asyncError(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentMethod,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingCharges,
        totalAmount,
    } = req.body

    await Order.create({
        user: req.user._id,
        shippingInfo,
        orderItems,
        paymentMethod,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingCharges,
        totalAmount,
    })

    for (let index = 0; index < orderItems.length; index++) {
        //Lấy ra sản phẩm thông qua id và gán vào biến product
        const product = await Product.findById(orderItems[index].product)

        //Số lượng của sản phầm sẽ được gán lại sau khi trừ đi số lượng hàng trong order
        product.stock -= orderItems[index].quantity
        await product.save()
    }

    res.status(201).json({
        success: true,
        message: "Tạo hóa đơn thành công!",
    })
})

export const getMyOrders = asyncError(async (req, res, next) => {
    const order = await Order.find({ user: req.user._id })

    res.status(201).json({
        success: true,
        order,
    })
})

export const getAdminOrders = asyncError(async (req, res, next) => {
    const order = await Order.find({})

    res.status(200).json({
        success: true,
        order,
    })
})

export const getOrderDetails = asyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    if (!order) return next(new ErrorHandler("Không tìm thấy hóa đơn!", 404))

    res.status(201).json({
        success: true,
        order,
    })
})

export const processOrder = asyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    if (!order) return next(new ErrorHandler("Không tìm thấy hóa đơn!", 404))

    if (order.orderStatus === "Đợi xác nhận") order.orderStatus = "Đã xác nhận"
    else if (order.orderStatus === "Đã xác nhận") {
        order.orderStatus = "Đã được vận chuyển"
        order.deliveredAt = new Date(Date.now())
    } else return next(new ErrorHandler("Đơn đã được vận chuyển!", 400))

    await order.save()

    res.status(201).json({
        success: true,
        message: "Thay đổi thành công!",
    })
})
