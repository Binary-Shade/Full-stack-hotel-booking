import { Router } from "express";
import { deleteUser, getAllUser, getUser, updateUser } from "../controllers/user.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = Router()

// AUTH
router.get('/checkUser/:id', verifyUser, (req, res)=>{
    res.send("you are a good user")
})
router.get('/checkAdmin/:id', verifyAdmin, (req, res)=>{
    res.send("you are a admin user")
})

// UPDATE
router.put('/:id', updateUser)

// DELETE
router.delete('/:id', deleteUser)

// GET 
router.get('/:id', getUser)

// GET ALL
router.get('/', getAllUser)


export default router