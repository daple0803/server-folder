import mongoose from "mongoose"

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Vui lòng điền tên sản phẩm"],
    },
    description: {
        type: String,
        required: [true, "Vui lòng điền mô tả sản phẩm"],
    },
    price: {
        type: Number,
        required: [true, "Vui lòng điền giá sản phẩm"],
    },
    stock: {
        type: Number,
        required: [true, "Vui lòng nhập số lượng "],
    },
    images: [{ public_id: String, url: String }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

export const Product = mongoose.model("Product", schema)
