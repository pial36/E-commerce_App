import mongoose, { Types } from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type : String, required: true },
    email: { type : String, required: true, unique: true },
    password: { type : String, required: true },
    cartData: { type : Object, default: {}},
    name: { type : String, required: true },
}, { minimize: false })

const userModel = mongoose.models.userModel || mongoose.model('user',userSchema);

export default userModel