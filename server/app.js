import express from 'express'
import session from 'express-session'

import cors from 'cors'
import helmet from 'helmet';
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import router from './routes/router.js'
import connectDB from './configs/mongo.js';

import mongoDBSessionFunc from 'connect-mongodb-session'
import { jwtParser } from './utils/jwt.js';
dotenv.config({path: './server/.env'})

connectDB()


const port = process.env.PORT || 5000

const app = express()
app.use(cookieParser() )

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}))
app.use(helmet())


app.use('/', router)
app.get('/', (req,res) => res.send('123'))
app.listen(port, () => console.log(`Listening on port ${port}`))


