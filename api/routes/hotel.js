import { Router } from "express";
import { createHotel, deleteHotel, getAllHotel, getHotel, updateHotel } from "../controllers/hotel.js";

const router = Router()

// CREATE
router.post('/', createHotel)
// UPDATE
router.put('/:id', updateHotel)

// DELETE
router.delete('/:id', deleteHotel)

// GET 
router.get('/:id', getHotel)

// GET ALL
router.get('/', getAllHotel)


export default router