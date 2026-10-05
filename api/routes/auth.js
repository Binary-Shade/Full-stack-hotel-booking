import { Router } from "express";
import { login, register, googleLogin, adminLogin, verifyAdminSession, logout } from "../controllers/auth.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router()

router.post('/register',register)
router.post('/login',login)
router.post('/google',googleLogin)
router.post('/logout', logout)

// Admin panel: session only issued to admins; verify re-checks on every page
router.post('/admin/login', adminLogin)
router.get('/admin/verify', verifyAdmin, verifyAdminSession)

export default router