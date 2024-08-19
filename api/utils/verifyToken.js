import jwt from 'jsonwebtoken'
import { createError } from './error.js';
import User from '../models/User.js';

export const verifyToken = (req, res, next) =>{
    const token = req.cookies.access_token;

    if(!token){
        next(createError(401, 'unauthorized'))
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if(err) return next(createError(403, 'not valid token'))
        req.user = user
        next()
    })
}

export const verifyUser = (req, res, next) =>{
    const id = req.params.id
    verifyToken(req, res,next, ()=>{
        // console.log(req.user);
        if(req.user.id === id || req.user.isAdmin){
            next()
        }else{
            next(createError(403, 'you are a bad user !'))
        }
    })
}
export const verifyAdmin = (req, res, next) =>{
    const id = req.params.id
    verifyToken(req, res, next,()=>{
        console.log(req.user);
        if(req.user.isAdmin){
            next()
        }else{
            next(createError(403, 'you are a bad user !'))
        }
    })
}
