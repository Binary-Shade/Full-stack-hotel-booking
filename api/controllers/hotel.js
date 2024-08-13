import Hotel from '../models/Hotel.js'

// create
export const createHotel = async (req, res, next) =>{
    const newHotel = Hotel(req.body)
    try {
        const result = await newHotel.save()
        res.status(200).json(result)
    }catch(err){
        next(err)
    }
}

//update
export const updateHotel = async (req, res, next) =>{
    const id = req.params.id
    try {
        const updatedHotel = await Hotel.findByIdAndUpdate(id ,{
            $set: req.body
        },{
            new: true
        })
        res.status(200).json(updatedHotel)
    }catch(err){
        next(err)
    }
}

// delete
export const deleteHotel = async (req, res, next) =>{
    const id = req.params.id
    try {
        await Hotel.findByIdAndDelete(id)
        res.status(200).json({
            msg: 'hotel deleted !'
        })
    }catch(err){
        next(err)
    }
}
// get 
export const getHotel = async (req, res, next) =>{
    const id = req.params.id
    try {
        const hotel = await Hotel.findById(id)
        res.status(200).json(hotel)
    }catch(err){
        next(err)
    }
}
// get all
export const getAllHotel = async (req, res, next) =>{
    try {
        const hotels = await Hotel.find()
        res.status(200).json(hotels)
    }catch(err){
        next(err)
    }
}


