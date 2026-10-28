import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    // optional discount; the sale price is price * (100 - discountPercent) / 100
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    // optional size chart: [{ size, chest, length }] in inches
    sizeChart: { type: [{ _id: false, size: String, chest: Number, length: Number }], default: [] },
    bestseller: { type:Boolean },
    date: { type: Number, required: true },
})

const productModel = mongoose.models.product || mongoose.model("product",productSchema);

export default productModel;