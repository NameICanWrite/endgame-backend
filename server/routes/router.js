import express from 'express'
import dotenv from 'dotenv'

import loginRouter from './userRoutes/loginRouter.js'
import userDataRouter from './userRoutes/userDataRouter.js'
import battleRouter from './battleRouter.js'
import { jwtParser } from '../utils/jwt.js'

const router = express.Router()


router.use(express.json());
router.use(express.urlencoded({extended: true}))



router.use("/users", loginRouter);
router.use('/users', userDataRouter)
router.use('/battle', battleRouter)

router.get('/', (req, res) => {

    res.send('root path')
})






export default router