import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { apiCorsOptions } from './config/cors.js';
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
// SE4030 SECURITY FIX - Z6
// Vulnerability: X-Content-Type-Options Header Missing; Detection: OWASP ZAP.
// Original: parsers and CORS could respond before the full Helmet middleware.
// Fix: set nosniff before those early responses; retain all existing controls.
app.use(helmet.xContentTypeOptions());
app.use(cookieParser())
app.use(json());
// SE4030 SECURITY FIX - Z3
// Vulnerability: Cross-Domain Misconfiguration; Detection: OWASP ZAP.
// ORIGINAL CONFIGURATION (DISABLED; already restricted to one frontend):
// app.use(cors({
//     origin: 'http://localhost:5173',
// }));
// Fix: exact client/admin allowlist; credential permission only for matches.
app.use((req, res, next) => {
    res.vary('Origin'); // Keep allowed and denied responses distinct in caches.
    next();
});
app.use(cors(apiCorsOptions()));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
}));


// middlewares
app.use('/api/auth', authRoute)
app.use('/api/users', usersRoute)
app.use('/api/hotels', hotelsRoute)
app.use('/api/rooms', roomsRoute)

// SE4030 SECURITY FIX - Z1
// Vulnerability: CSP: Failure to Define Directive with No Fallback
// Detection: OWASP ZAP
// Original: no explicit 404 handler; Express replaced Helmet's CSP with
// default-src 'none', omitting frame-ancestors and form-action.
// Fix: return JSON for unmatched routes and preserve Helmet's explicit policy.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        status: 404,
        message: 'route not found',
    });
});

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
// SECURITY: never send err.stack or raw internal error messages to the client.
// Expected errors (status < 500) keep their message; unexpected ones get a
// generic message and are logged on the server only.
app.use((err, req, res, next)=>{
    let stat = err.status || err.statusCode || 500
    let msg = err.message
    if (err.name === 'CastError') {   // malformed ObjectId in the URL
        stat = 400
        msg = 'invalid id'
    }
    if (err.type === 'entity.parse.failed') {   // invalid JSON body
        msg = 'invalid JSON'
    }
    if (stat >= 500) {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err)
        msg = 'something went wrong !'
    }
    res.status(stat).json({
        success: false,
        status : stat,
        message: msg,
    })
})

mongoose.connection.on("disconnected", () => {
    console.log('Database disconnected');
});

app.listen(8001, async () => {
    await main();  // Ensuring database connection before starting the server
    console.log('Server listening on port 8001');
});
