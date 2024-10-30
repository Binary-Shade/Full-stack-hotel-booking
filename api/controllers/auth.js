import User from "../models/User.js"
import bcrypt from 'bcryptjs'
import { createError } from "../utils/error.js";
import jwt from 'jsonwebtoken'

export const register = async(req, res, next)=>{
   var salt = bcrypt.genSaltSync(10)
   var hash = bcrypt.hashSync(req.body.password , salt);
    try {
         const newUser = new User({
            ...req.body,
            password: hash,
         })
         await newUser.save()
         res.status(201).json({
            msg: 'user saved'
         })
    } catch (error) {
       next(error) 
    }
}
// Login
export const login = async(req, res, next)=>{
   try {
       const user = await User.findOne({
          username: req.body.username
       })
       if(!user) return next(createError(404, "user not found"))
         const isCorrect = await bcrypt.compare(req.body.password, user.password)
       if(!isCorrect){
         return next(createError(400, "user not found or password not match!"))
       }

         const {password, isAdmin, ...otherDetails} = user._doc
         const token = jwt.sign({
            id: user._id,
            isAdmin: user.isAdmin
         }, process.env.JWT_SECRET)

         res.cookie("access_token", token, {
            httpOnly: true
         }).status(200).json({details:{...otherDetails, isAdmin}})
       
    } catch (error) {
       next(error) 
    }
}