import User from '../models/User.js'
import {v2 as cloudinary} from 'cloudinary'

//update
export const updateUser = async (req, res, next) =>{
    const id = req.params.id
    try {
        const updatedUser = await User.findByIdAndUpdate(id ,{
            $set: req.body
        },{
            new: true
        })
        res.status(200).json(updatedUser)
    }catch(err){
        next(err)
    }
}

// delete
export const deleteUser = async (req, res, next) =>{
    const id = req.params.id
    try {
        await User.findByIdAndDelete(id)
        res.status(200).json({
            msg: 'User deleted !'
        })
    }catch(err){
        next(err)
    }
}
// get 
export const getUser = async (req, res, next) =>{
    const id = req.params.id
    try {
        const user = await User.findById(id)
        res.status(200).json(user)
    }catch(err){
        next(err)
    }
}
// get all
export const getAllUser = async (req, res, next) =>{
    try {
        const users = await User.find()
        res.status(200).json(users)
    }catch(err){
        next(err)
    }
}

export const upload = async (req, res, next)=>{
    try{
        const response = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", 
            {
                public_id: 'shoes',
            }
        )
        res.json(response)
    }catch(err){
        res.json(err)
    }
}

