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
// Count by city
export const countByCity = async (req, res, next) =>{
    const cities = req.query.cities.split(',')
    try {
        const list =await Promise.all(cities.map(city=>{
            return Hotel.countDocuments({city: city})
        }))
        res.status(200).json(list)
    }catch(err){
        next(err)
    }
}
// Count by type
export const countByType = async (req, res, next) =>{
    const hotel = await Hotel.countDocuments({type: 'Hotel'})
    const apart = await Hotel.countDocuments({type: 'Apartments'})
    const resorts = await Hotel.countDocuments({type: 'Resorts'})
    const hotel = await Hotel.countDocuments({type: 'Hotel'})
    try {
        const list =await Promise.all(cities.map(city=>{
            return Hotel.countDocuments({city: city})
        }))
        res.status(200).json(list)
    }catch(err){
        next(err)
    }
}


