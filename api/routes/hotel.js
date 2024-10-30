import { Router } from "express";
import { countByCity, countByType, createHotel, deleteHotel, getAllHotel, getHotel, getHotelRooms, updateHotel } from "../controllers/hotel.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router();

// COUNT
router.get('/countByCity', countByCity);
router.get('/countByType', countByType);

// CREATE
router.post('/', createHotel);

// UPDATE
router.put('/:id', updateHotel);

// DELETE
router.delete('/find/:id', deleteHotel);

// GET  
router.get('/:id', getHotel);

// GET ALL
router.get('/', getAllHotel);

// GET ROOMS
router.get('/room/:id', getHotelRooms);


export default router;
