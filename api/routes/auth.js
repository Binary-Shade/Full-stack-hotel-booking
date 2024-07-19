import express from 'express'

const router = express.Router()

router.get('/', (req, res)=>{
    res.send('auth endpoint')
})

router.get('/register', (req, res)=>{
    res.send('register endpoint')
})

export default router