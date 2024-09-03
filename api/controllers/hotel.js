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
export const getAllHotel = async (req, res, next) => {
    try {
        const { limit, ...others } = req.query; 
        const hotels = await Hotel.find(...others).limit(Number(limit) || 10); 
        res.status(200).json(hotels);
    } catch (err) {
        next(err); 
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



