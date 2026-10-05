import { Router } from "express";
import {createRoom, deleteRoom, getAllRoom, getRoom, updateAvailability, updateRoom} from '../controllers/room.js'
import { verifyAdmin, verifyToken } from "../utils/verifyToken.js";

const router = Router()

// CREATE
router.post('/:hotelId', verifyAdmin, createRoom)
// UPDATE
router.put('/:id', verifyAdmin, updateRoom)

// UPDATE AVAILABLE (reserve) - SECURITY: must be logged in (was open to anyone)
router.put('/available/:id', verifyToken, updateAvailability)

// DELETE
router.delete('/:id/:hotelId', verifyAdmin, deleteRoom)

// GET
router.get('/:id', getRoom)

// GET ALL
router.get('/', getAllRoom)


export default router