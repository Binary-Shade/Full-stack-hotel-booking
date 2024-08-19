import { Router } from "express";
import { createHotel, deleteHotel, getAllHotel, getHotel, updateHotel } from "../controllers/hotel.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router()

// CREATE
router.post('/',verifyAdmin, createHotel)
// UPDATE
router.put('/:id',verifyAdmin, updateHotel)

// DELETE
router.delete('/:id',verifyAdmin, deleteHotel)

// GET 
router.get('/:id', getHotel)

// GET ALL
router.get('/', getAllHotel)


export default router