import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from "dotenv";
import authRoute from './routes/auth.js'
import usersRoute from './routes/users.js'
import roomsRoute from './routes/rooms.js'
import hotelsRoute from './routes/hotel.js'
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary'

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.CLOUD_SECRET
})


const app = express();
app.use(cookieParser())
app.use(json());
app.use(cors({
    origin: 'http://localhost:5173',
}));
app.use(helmet());


// middlewares
app.use('/api/auth', authRoute)
app.use('/api/users', usersRoute)
app.use('/api/hotels', hotelsRoute)
app.use('/api/rooms', roomsRoute)

// mongodb connection
const main = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO);
        console.log('Database connected!');
    } catch (err) {
        console.error('Failed to connect to database', err);
        throw err;
    }
};

// error handler
app.use((err, req, res, next)=>{
    const stat = err.status || 500 
    const msg = err.message || 'something went wrong !'
    res.status(stat).json({
        success: false,
        status : stat,
        message: msg,
        stack: err.stack
    })
})

mongoose.connection.on("disconnected", () => {
    console.log('Database disconnected');
});

app.listen(8001, async () => {
    await main();  // Ensuring database connection before starting the server
    console.log('Server listening on port 8001');
});
