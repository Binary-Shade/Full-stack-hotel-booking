import { Router } from "express";
import {createRoom, deleteRoom, getAllRoom, getRoom, updateRoom} from '../controllers/room.js'
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router()

// CREATE
router.post('/:hotelId',verifyAdmin,createRoom)
// UPDATE
router.put('/:id',verifyAdmin, updateRoom)

// DELETE
router.delete('/:id/:hotelId',verifyAdmin, deleteRoom)

// GET 
router.get('/:id', getRoom)

// GET ALL
router.get('/', getAllRoom)


export default router