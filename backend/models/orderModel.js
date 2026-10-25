import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, require: true },
    items: { type: Array, require: true },
    amount: { type: Number, require: true },
    address: { type: Object, require: true },
    shipping: { type: Object },
    status: { type: String, require: true, default:'Order Placed' },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    stripeSessionId: { type: String },
    date: { type: Number, required: true },

})


const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)

export default orderModel;