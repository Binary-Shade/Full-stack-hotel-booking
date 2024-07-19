import mongoose from "mongoose"

const farmSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    type:{
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    },
    address:{
        type: String,
        required: true
    },
    distance:{
        type: [String],
    },
    photos:{
        type: String,
        required: true
    },
    desc:{
        type: String,
        required: true
    },
    rating:{
        type: String,
        min:0,
        max:5
    },
    rooms:{
        type: [String]
    },
    cheapestPrice:{
        type: Number,
        required: true
    },
    featured:{
        type: Boolean,
        default: false
    },
})

export default mongoose.model('Farm', farmSchema)