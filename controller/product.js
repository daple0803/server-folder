import { asyncError } from "../middlewares/error.js"
import { Product } from "../models/product.js"
import ErrorHandler from "../utils/error.js"
import { getDataUri } from "../utils/features.js"
import cloudinary from "cloudinary"
import { Category } from "../models/category.js"

export const getAllProducts = asyncError(async (req, res, next) => {
    const { keyword, category } = req.query

    const products = await Product.find({
        name: {
            $regex: keyword ? keyword : "",
            $options: "i",
        },
        category: category ? category : undefined,
    })

    res.status(200).json({
        success: true,
        products,
    })
})

export const getAdminProducts = asyncError(async (req, res, next) => {
    const products = await Product.find({}).populate("category")

    const outOfStock = products.filter((product) => product.stock === 0)

    res.status(200).json({
        success: true,
        products,
        outOfStock: outOfStock.length,
        inStock: products.length - outOfStock.length,
    })
})

export const getProductDetails = asyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate("category")

    if (!product) return next(new ErrorHandler("Không tìm thấy sản phẩm", 404))

    res.status(200).json({
        success: true,
        product,
    })
})

export const createProduct = asyncError(async (req, res, next) => {
    const { name, description, category, price, stock } = req.body

    if (!req.file)
        return next(new ErrorHandler("Vui lòng thêm hình ảnh sản phẩm", 404))

    const file = getDataUri(req.file)
    const myCloud = await cloudinary.v2.uploader.upload(file.content)
    const image = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
    }

    await Product.create({
        name,
        description,
        category,
        price,
        stock,
        images: [image],
    })

    res.status(200).json({
        success: true,
        message: "Thêm sản phẩm mới thành công!",
    })
})

export const updateProduct = asyncError(async (req, res, next) => {
    const { name, description, category, price, stock } = req.body
    const product = await Product.findById(req.params.id)

    if (!product) return next(new ErrorHandler("Không tìm thấy sản phẩm", 404))

    if (name) product.name = name
    if (description) product.description = description
    if (price) product.price = price
    if (stock) product.stock = stock
    if (category) product.category = category

    await product.save()

    res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công!",
    })
})

export const addProductImage = asyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    if (!product) return next(new ErrorHandler("Không tìm thấy sản phẩm", 404))

    if (!req.file)
        return next(new ErrorHandler("Vui lòng thêm hình ảnh sản phẩm", 404))

    const file = getDataUri(req.file)
    const myCloud = await cloudinary.v2.uploader.upload(file.content)
    const image = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
    }

    product.images.push(image)
    await product.save()

    res.status(200).json({
        success: true,
        message: "Thêm hình ảnh thành công!",
    })
})

export const deleteProductImage = asyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    if (!product) return next(new ErrorHandler("Không tìm thấy sản phẩm", 404))

    const id = req.query.id

    if (!id) return next(new ErrorHandler("Vui lòng nhập ID ảnh", 400))

    let isExist = -1

    product.images.forEach((item, index) => {
        if (item._id.toString() === id.toString()) isExist = index
    })

    if (isExist < 0)
        return next(new ErrorHandler("Hình ảnh không tồn tại!", 404))
    await cloudinary.v2.uploader.destroy(product.images[isExist].public_id)

    product.images.splice(isExist, 1)

    await product.save()

    res.status(200).json({
        success: true,
        message: "Xóa hình ảnh thành công!",
    })
})

export const deleteProduct = asyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
    if (!product) return next(new ErrorHandler("Không tìm thấy sản phẩm", 404))

    for (let index = 0; index < product.images.length; index++) {
        await cloudinary.v2.uploader.destroy(product.images[index].public_id)
    }
    await product.deleteOne()
    res.status(200).json({
        success: true,
        message: "Xóa sản phẩm thành công!",
    })
})

export const addCategory = asyncError(async (req, res, next) => {
    const { category } = req.body

    await Category.create({ category })

    res.status(201).json({
        success: true,
        message: "Thêm danh mục thành công!",
    })
})

export const getAllCategory = asyncError(async (req, res, next) => {
    const categories = await Category.find({})

    res.status(201).json({
        success: true,
        categories,
    })
})

export const deleteCategory = asyncError(async (req, res, next) => {
    const category = await Category.findById(req.params.id)
    if (!category) return next(new ErrorHandler("Danh mục không tồn tại", 404))

    //Lấy ra [] gồm các sản phẩm có category trùng với category gửi về từ JSON
    const products = await Product.find({ category: category._id })

    for (let i = 0; i < products.length; i++) {
        const product = products[i]
        product.category = undefined
        await product.save()
    }

    await category.deleteOne()

    res.status(200).json({
        success: true,
        message: "Xóa danh mục thành công!",
    })
})
