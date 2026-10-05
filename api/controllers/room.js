import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import mongoose from "mongoose";
import { createError } from "../utils/error.js";

//create
export const createRoom = async (req, res, next) => {
    const hotelId = req.params.hotelId;
    const newRoom = new Room(req.body);
    try {
        const saveRoom = await newRoom.save()
        try {
            await Hotel.findByIdAndUpdate(hotelId, {
                $push: {
                    rooms : saveRoom._id
                }
            })
        } catch (error) {
            next(error)
        }
        res.status(200).json('room created')
    } catch (error) {
       next(error) 
    }
}

//update
export const updateRoom = async (req, res, next) =>{
    const id = req.params.id
    try {
        const updatedRoom = await Room.findByIdAndUpdate(id ,{
            $set: req.body
        },{
            new: true
        })
        res.status(200).json(updatedRoom)
    }catch(err){
        next(err)
    }
}
// update dates (reserve room numbers)
// SECURITY: dates are validated, and the update only happens if none of the
// requested nights are already booked (atomic check-and-set), so the same
// night can no longer be sold twice.
const MAX_NIGHTS = 30
export const updateAvailability = async (req, res, next) =>{
    const id = req.params.id
    const dates = req.body.dates

    if (!mongoose.isValidObjectId(id)) {
        return next(createError(400, 'invalid room id'))
    }
    if (!Array.isArray(dates) || dates.length === 0 || dates.length > MAX_NIGHTS) {
        return next(createError(400, `dates must be an array of 1-${MAX_NIGHTS} days`))
    }
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const parsed = dates.map(d => new Date(d))
    if (parsed.some(d => isNaN(d.getTime()) || d < startOfToday)) {
        return next(createError(400, 'dates must be valid and not in the past'))
    }

    try {
        const result = await Room.updateOne({
            roomNumbers: { $elemMatch: { _id: id, unavailableDates: { $nin: parsed } } }
        }, {
            $push: { 'roomNumbers.$.unavailableDates': { $each: parsed } }
        })
        if (result.matchedCount === 0) {
            return next(createError(409, 'room not found or already booked for those dates'))
        }
        res.status(200).json('dates updated successfully')
    }catch(err){
        next(err)
    }
}

export const available =async ( req, res, next) =>{
    res.json({message: 'love'})
}

// delete
export const deleteRoom = async (req, res, next) =>{
    const hotelId = req.params.hotelId
    const id = req.params.id
    try {
        await Room.findByIdAndDelete(id)
        try {
            await Hotel.findByIdAndUpdate(hotelId, {
                $pull: {
                    rooms : id
                }
            })
        } catch (error) {
            next(error)
        }
        res.status(200).json({
            msg: 'Room deleted !'
        })
    }catch(err){
        next(err)
    }
}
// get 
export const getRoom = async (req, res, next) =>{
    const id = req.params.id
    try {
        const room = await Room.findById(id)
        res.status(200).json(room)
    }catch(err){
        next(err)
    }
}
// get all
export const getAllRoom = async (req, res, next) =>{
    try {
        const rooms = await Room.find()
        res.status(200).json(rooms)
    }catch(err){
        next(err)
    }
}