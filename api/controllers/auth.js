import User from "../models/User.js"
import bcrypt from 'bcryptjs'
import { createError } from "../utils/error.js";
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Register
// SECURITY FIX (Mass Assignment / Privilege Escalation - CWE-915):
// Previously the whole request body was spread into the new User
// (`new User({...req.body})`), so anyone could send "isAdmin": true and
// register themselves as an administrator. Now only an allow-list of
// fields is copied from the request, and isAdmin always takes the schema
// default (false). Admin rights can only be granted by an existing admin.
export const register = async (req, res, next) => {
   try {
      const { username, email, password, country, city, phone, img } = req.body

      const required = { username, email, password, country, city }
      for (const [field, value] of Object.entries(required)) {
         if (typeof value !== 'string' || value.trim() === '') {
            return next(createError(400, `${field} is required`))
         }
      }

      const hash = await bcrypt.hash(password, 10)

      const newUser = new User({
         username,
         email,
         password: hash,
         country,
         city,
         phone,
         img,
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
       if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
          return next(createError(400, "invalid username or password format"))
       }
       const user = await User.findOne({
          username: req.body.username
       }).select('+password')
       if(!user) return next(createError(404, "user not found"))
         const isCorrect = await bcrypt.compare(req.body.password, user.password)
       if(!isCorrect){
         return next(createError(400, "user not found or password not match!"))
       }

         const {password, isAdmin, ...otherDetails} = user._doc
         const token = jwt.sign({
            id: user._id,
            isAdmin: user.isAdmin
         }, process.env.JWT_SECRET, { expiresIn: "1d" })

         res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
         }).status(200).json({details:{...otherDetails, isAdmin}})

    } catch (error) {
       next(error)
    }
}

// Google OAuth / OpenID Connect Login
// Accepts a Google ID token from the frontend (obtained via Google Identity
// Services on the client), verifies its signature and audience with Google's
// servers, then finds or creates a local user and issues the same JWT/cookie
// session as a normal login.
export const googleLogin = async (req, res, next) => {
   try {
      const { credential } = req.body
      if (typeof credential !== 'string' || credential.trim() === '') {
         return next(createError(400, "missing Google credential"))
      }

      const ticket = await googleClient.verifyIdToken({
         idToken: credential,
         audience: process.env.GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload || !payload.email_verified) {
         return next(createError(401, "Google account email not verified"))
      }

      let user = await User.findOne({ email: payload.email })

      if (!user) {
         // Create a local account for this Google user. A random password
         // is generated and hashed since the schema requires one, but it
         // is never used or shared with the user (they always log in via
         // Google for this account). country/city/phone are placeholders
         // since Google does not provide this information; the user can
         // update them later via their profile.
         const randomPassword = await bcrypt.hash(
            payload.sub + Date.now().toString(),
            10
         )
         user = new User({
            username: payload.email.split('@')[0] + '_' + payload.sub.slice(-6),
            email: payload.email,
            password: randomPassword,
            country: 'Not specified',
            city: 'Not specified',
            phone: 0,
            img: payload.picture || '',
         })
         await user.save()
      }

      const token = jwt.sign({
         id: user._id,
         isAdmin: user.isAdmin
      }, process.env.JWT_SECRET, { expiresIn: "1d" })

      const { password, isAdmin, ...otherDetails } = user._doc

      res.cookie("access_token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "strict",
         maxAge: 24 * 60 * 60 * 1000
      }).status(200).json({ details: { ...otherDetails, isAdmin } })

   } catch (error) {
      next(error)
   }
}

// Admin login
// SECURITY: the admin panel used to call the normal /login and decide in the
// BROWSER whether the user was an admin. A non-admin still got a session cookie
// and the check could be bypassed. The server now refuses non-admins.
export const adminLogin = async(req, res, next)=>{
   try {
       if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
          return next(createError(401, "invalid credentials"))
       }
       const user = await User.findOne({ username: req.body.username }).select('+password')
       const isCorrect = user && await bcrypt.compare(req.body.password, user.password)
       if(!isCorrect || !user.isAdmin){
         return next(createError(401, "invalid credentials"))
       }
       const {password, isAdmin, ...otherDetails} = user._doc
       const token = jwt.sign({
          id: user._id,
          isAdmin: user.isAdmin
       }, process.env.JWT_SECRET, { expiresIn: "1d" })

       res.cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000
       }).status(200).json({details:{...otherDetails, isAdmin}})
   } catch (error) {
      next(error)
   }
}

// The admin panel calls this on every protected page: the SERVER decides.
export const verifyAdminSession = (req, res) => {
   res.status(200).json({ isAdmin: true })
}

export const logout = (req, res) => {
   res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
   }).status(200).json({ msg: "logged out" })
}
