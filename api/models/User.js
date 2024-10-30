import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
    },
    country:{
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true,
    },
    phone:{
        type: Number,
        required: true,
    },
    img: {
        type: String
    },
    isAdmin:{
        type: Boolean,
        default: false,
    }
    
},{
    timestamps: true
})

export default mongoose.model("User", UserSchema)