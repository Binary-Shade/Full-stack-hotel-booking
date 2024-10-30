import { Router } from "express";
import {createRoom, deleteRoom, getAllRoom, getRoom, updateAvailability, updateRoom} from '../controllers/room.js'
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router()

// CREATE
router.post('/:hotelId',createRoom)
// UPDATE
router.put('/:id', updateRoom)

//UPDATE AVAILABLE
router.put('/available/:id', updateAvailability)

// DELETE
router.delete('/:id/:hotelId', deleteRoom)

// GET 
router.get('/:id', getRoom)

// GET ALL
router.get('/', getAllRoom)


export default router