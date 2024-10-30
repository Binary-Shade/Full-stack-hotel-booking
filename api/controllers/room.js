import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";

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
//update dates
export const updateAvailability = async (req, res, next) =>{
    const id = req.params.id
    console.log(id);
    console.log(req.body.dates);
    try {
        await Room.updateOne({
            'roomNumbers._id': id
        }, {
            $push: {
                'roomNumbers.$.unavailableDates': req.body.dates
            }
        })
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