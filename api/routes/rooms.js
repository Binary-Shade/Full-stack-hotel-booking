import { Router } from "express";

const router = Router()

router.get('/', (req, res)=>{
    res.send('auth point')
})
router.get('/register', (req, res)=>{
    res.send('register point ')
})

export default router