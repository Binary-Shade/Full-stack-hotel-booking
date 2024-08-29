import { Router } from "express";
import { countByCity, countByType, createHotel, deleteHotel, getAllHotel, getHotel, updateHotel } from "../controllers/hotel.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const router = Router();

// COUNT
router.get('/countByCity', countByCity);
router.get('/countByType', countByType);

// CREATE
router.post('/', verifyAdmin, createHotel);

// UPDATE
router.put('/:id', verifyAdmin, updateHotel);

// DELETE
router.delete('/find/:id', verifyAdmin, deleteHotel);

// GET 
router.get('/:id', getHotel);

// GET ALL
router.get('/', getAllHotel);


export default router;
