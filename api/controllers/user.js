import User from '../models/User.js'
import {v2 as cloudinary} from 'cloudinary'
import bcrypt from 'bcryptjs'

//update
// SECURITY FIX (Mass Assignment - CWE-915):
// Previously `$set: req.body` let a logged-in user send {"isAdmin": true}
// to PUT /api/users/<their id> and promote themselves to admin (and a new
// password was stored in plain text). Now only an allow-list of profile
// fields can be changed, passwords are hashed, and only an admin may
// change the isAdmin flag.
const UPDATABLE_FIELDS = ['email', 'country', 'city', 'phone', 'img']

export const updateUser = async (req, res, next) =>{
    const id = req.params.id
    try {
        const updates = {}
        for (const field of UPDATABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field]
        }
        if (typeof req.body.password === 'string' && req.body.password !== '') {
            updates.password = await bcrypt.hash(req.body.password, 10)
        }
        if (req.user?.isAdmin && typeof req.body.isAdmin === 'boolean') {
            updates.isAdmin = req.body.isAdmin
        }

        const updatedUser = await User.findByIdAndUpdate(id ,{
            $set: updates
        },{
            new: true,
            runValidators: true
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