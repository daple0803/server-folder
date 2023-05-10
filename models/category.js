import mongoose from "mongoose"

const schema = new mongoose.Schema({
    category: {
        type: String,
        required: [true, "Vui lòng nhập danh mục"],
    },
})

export const Category = mongoose.model("Category", schema)
