import Hotel from '../models/Hotel.js'
import Room from '../models/Room.js'

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
    console.log(id);
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
export const getAllHotel = async (req, res, next) => {
    try {
        // const { limit, min = 1, max = 999, ...query } = req.query;
        // const lim = parseInt(limit) || 50; // Default limit to 10 if not provided
        // const hotels = await Hotel.find({ 
        //     ...query, 
        //     cheapestPrice: { $gt: min, $lt: max } 
        // }).limit(lim);

        // console.log(`Limit: ${lim}`);
        // console.log('Hotels:', hotels.length);
        const {limit, min, max, ...query} = req.query;
        const lim = parseInt(limit) || 40;
        const hotels = await Hotel.find({
            ...query
        }).limit(lim)
        res.status(200).json(hotels);
    } catch (err) {
        console.error('Error fetching hotels:', err);
        next(err);
    }
};


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
export const countByType = async (req, res, next) => {
    try {
        // Perform the aggregation to group and count the documents by type
        const counts = await Hotel.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Define the fixed order of types
        const typeOrder = ["hotel", "apartment", "resort", "villa", "cabin"];

        // Create a map to easily access counts by type
        const countMap = counts.reduce((acc, item) => {
            acc[item._id.toLowerCase()] = item.count;
            return acc;
        }, {});

        // Map the results in the desired order
        const formattedCounts = typeOrder.map(type => ({
            type: type,
            count: countMap[type] || 0 // Default to 0 if the type is not in the countMap
        }));

        res.status(200).json(formattedCounts);
    } catch (err) {
        next(err);
    }
};

export const getHotelRooms = async (req, res, next) =>{
    try {
        const id = req.params.id
        const hotel = await Hotel.findById(id)
        console.log(id);
        const list = await Promise.all(hotel.rooms.map(room=>{
            return Room.findById(room)
        }))
        res.status(200).json(list)
    } catch (err) {
        next(err)
    }
}


