import express from 'express'
import session from 'express-session'
import http from 'http'

import cors from 'cors'
import helmet from 'helmet';
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import {
    Server
} from 'socket.io'
import socketioJwt from 'socketio-jwt'

import router from './routes/router.js'
import connectDB from './configs/mongo.js';
import Battle from './models/battle.js';
import User from './models/user.js'

import {
    calculateHP
} from './utils/battleTools.js'


process.setMaxListeners(0)

dotenv.config({
    path: './server/.env'
})

connectDB()


const port = process.env.PORT || 5000

const app = express()






app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}))
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
})
app.use(cookieParser())
app.use(helmet())

app.use('/', router)
app.get('/', (req, res) => res.send('123'))


io.use(socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true
}));

//I'm sorry but I dont know how to export this to other files


//reconnect + get battle from DB every time page reloads
io.on('connection', async (socket) => {
    const userId = socket.decoded_token.id
    let enemyId
    let battle = await Battle.findOne({
        users: {
            $elemMatch: {
                _id: userId
            }
        }
    })

    //battle should be already created by POST battle/start
    if (battle) {
        if (battle.users[0]._id != userId) {
            enemyId = battle.users[0]._id
        } else {
            enemyId = battle.users[1]?._id
        }
        socket.join(battle.id)
    } else {
        console.log('Battle doesn\'t exist')
        socket.disconnect(true)
    }

    socket.on('update battle', async (ongoingBattle) => {
        //check if battle is happening or ready to begin
        if (enemyId) {

            //check if battle is happening
            if (ongoingBattle) {

                //check if battle should continue
                if (!ongoingBattle.users.some(user => user.hp <= 0)) {

                    battle = await Battle.findByIdAndUpdate(battle._id, ongoingBattle)
                    socket.broadcast.to(battle.id).emit('update battle', ongoingBattle)
                } else {

                    //claim winner and finish battle
                    ongoingBattle.winner = ongoingBattle.users.find(user => user.hp > 0).username || 'unknown'
                    io.to(battle.id).emit('finish battle', ongoingBattle)
                    await Battle.findByIdAndDelete(battle._id)

                    //update user stats
                    const winner = await User.findOne({
                        username: ongoingBattle.winner
                    })
                    if (winner.data.wins) {
                        winner.data.wins++
                    } else {
                        winner.data.wins = 1
                    }
                    await User.updateOne({
                        username: ongoingBattle.winner
                    }, {
                        $set: {
                            data: winner.data
                        }
                    })
                }
            } else {

                //start battle
                ongoingBattle = await Battle.findById(battle._id)
                io.to(battle.id).emit('update battle', ongoingBattle)
            }
        }
    })

    //triggered when 2 users take turn
    socket.on('fight timer start', (battleData) => {
        console.log('fight timer start')
        battleData.fightTimer = 3
        const interval = setInterval(() => {
            battleData.fightTimer--
            console.log('fight timer: ' + battleData.fightTimer)

            //end of round
            if (battleData.fightTimer <= 0) {
                clearInterval(interval)

                //update hp (both)
                battleData = calculateHP(battleData)

                //delete previous round
                battleData.users[0].currentMove = undefined
                battleData.users[1].currentMove = undefined

                //choose who moves first in next round
                battleData.users[Math.floor(Math.random())].canMove = true

                battleData.fightTimer = undefined

                Battle.findByIdAndUpdate(battle._id, battleData)
            }
            
            io.to(battle.id).emit('update battle', battleData)
        }, 1000)
    })

    // socket.on('turn timer start', (battleData, index) => {
    //     console.log('start turn timer')
    //     battleData.users[index].turnTimer = 15
    
    //     const interval = setInterval(() => {
    //       battleData.users[index].turnTimer--
    //       console.log('turn timer: ' + battleData.users[index].turnTimer)
    
    //       io.to(battle.id).emit('update battle', battleData)
    
    //       if (battleData.users[index].turnTimer <= 0) {
    //         battleData.winner = battleData.users.find((user, currentIndex) => currentIndex != index)
    //         io.to(battle.id).emit('finish battle', battleData)
    //         clearInterval(interval)
    //       }
    //     }, 1000)
    
    //     socket.on('stop turn timer', (currentIndex) => {
    //         if (currentIndex == index) clearInterval(interval)
    //     })
    // })
})
server.listen(port, () => console.log(`Listening on port ${port}`))