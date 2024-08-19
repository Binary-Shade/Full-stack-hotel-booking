import { Router } from "express";
import { deleteUser, getAllUser, getUser, updateUser } from "../controllers/user.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = Router()

// AUTH
router.get('/checkAuth', verifyToken)

router.get('/checkUser/:id', verifyUser, (req, res)=>{
    res.send("you are a good user")
})
router.get('/checkAdmin/:id', verifyAdmin, (req, res)=>{
    res.send("you are a admin user")
})

// UPDATE
router.put('/:id',verifyUser, updateUser)

// DELETE
router.delete('/:id',verifyUser, deleteUser)

// GET 
router.get('/:id',verifyUser, getUser)

// GET ALL
router.get('/',verifyUser, getAllUser)


export default router