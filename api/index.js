import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoute from './routes/auth.js'
import roomsRoute from './routes/rooms.js'
import usersRoute from './routes/users.js'
import farmsRoute from './routes/farms.js'

const app = express()
dotenv.config()

const main = async () =>{
    try {
        await mongoose.connect(process.env.MONGO)
        console.log('database connected');
    }catch(err){
        console.error(err);
    }
}

mongoose.connection.on('disconnected', ()=>{
    console.log('mongoDB disconnected !');
})

app.get('/', (req, res)=>{
    res.send('helo umbi!')
})

//middleware
app.use('/api/auth', authRoute)
app.use('/api/users', usersRoute)
app.use('/api/farms', farmsRoute)
app.use('/api/rooms', roomsRoute)

// main().catch((err)=>console.log(err))

app.listen(8001, ()=>{
    console.log('server listening on 8001');
})