import mongoose from "mongoose";

const roomSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true,
    },
    maxpeople:{
        type: Number,
        required: true,
    },
    desc:{
        type: String,
        required: true,
    },
    roomNumbers:[{
        number: {
            type: Number
        },
        unavailableDates: {
            type: [Date]
        }
    }]
    
},{
    timestamps: true
})

export default mongoose.model("room", roomSchema)