import express from 'express'
import session from 'express-session'
import http from 'http'

import cors from 'cors'
import helmet from 'helmet';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import {promisify} from 'util'
import cookieParser from 'cookie-parser'
import socketCookieParser from 'socket.io-cookie-parser'
import {
    Server
} from 'socket.io'
import socketioJwt from 'socketio-jwt'

import router from './routes/router.js'
import connectDB from './configs/mongo.js';
import Battle from './models/battle.js';
import User from './models/user.js'

import {
    calculateHP, giveCards
} from './utils/battleTools.js'


process.setMaxListeners(0)

dotenv.config({
    path: './server/.env'
})

await connectDB()


const port = process.env.PORT || 5000

const app = express()






app.use(cors({
    origin: ["https://card-battle.netlify.app", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
}))
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ["https://card-battle.netlify.app", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
})
app.use(cookieParser())
app.use(helmet())

app.use('/', router)
app.get('/', (req, res) => res.send('123'))



io.use(socketCookieParser())

//I'm sorry but I dont know how to export this to other files


const roomsData = new Map()
//reconnect + get battle from DB every time page reloads
io.on('connection', async (socket) => {
    const token = socket.request.cookies.jwt
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET).catch(err => console.log(err.message))
    const userId = decoded.id
    let enemyId
    let battle = await Battle.findOne({
        users: {
            $elemMatch: {
                _id: userId
            }
        }
    })
    console.log(battle)

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
                    socket.disconnect(true)
                    clearInterval(roomsData.get(battle.id)?.turnTimer)
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
        const interval = setInterval(async () => {
            battleData.fightTimer--
            console.log('fight timer: ' + battleData.fightTimer)

            //end of round
            if (battleData.fightTimer <= 0) {
                clearInterval(interval)

                //update hp (both)
                battleData = calculateHP(battleData)

                //delete previous round
                delete battleData.users[0].currentMove
                delete battleData.users[1].currentMove

                delete battleData.users[0].turnTimer
                delete battleData.users[1].turnTimer
                
                //give cards
                battleData.users[1] = giveCards(battleData.users[1])
                battleData.users[0] = giveCards(battleData.users[0])
                
                //choose who moves first in next round
                battleData.users[Math.round(Math.random())].canMove = true

                delete battleData.fightTimer

                Battle.findByIdAndUpdate(battle._id, battleData)

                //if battle should be continued
                if (!battleData.users.some(user => user.hp <= 0)) {

                    await Battle.findByIdAndUpdate(battle._id, battleData)
                    socket.broadcast.to(battle.id).emit('update battle', battleData)
                } else {

                    //claim winner and finish battle
                    battleData.winner = battleData.users.find(user => user.hp > 0)?.username || 'death'
                    io.to(battle.id).emit('finish battle', battleData)
                    await Battle.findByIdAndDelete(battle._id)

                    //update user stats
                    const winner = await User.findOne({
                        username: battleData.winner
                    })
                    if (winner.data.wins) {
                        winner.data.wins++
                    } else {
                        winner.data.wins = 1
                    }
                    await User.updateOne({
                        username: battleData.winner
                    }, {
                        $set: {
                            data: winner.data
                        }
                    })
                }
            } else socket.broadcast.to(battle.id).emit('update battle', battleData)
        }, 1000)
    })

    socket.on('turn timer start', (battleData, index) => {

        if (battleData && (typeof index === 'number')) {console.log('start turn timer')
        battleData.users[index].turnTimer = 15

        const data = roomsData.get(battle.id) || {}
    
        data.turnTimer = setInterval(async () => {
          battleData.users[index].turnTimer--
          console.log('turn timer: ' + battleData.users[index].turnTimer)
    
            //check if interval wasn't cleared
            let destroyed = roomsData.get(battle.id).turnTimer._destroyed
          if (!destroyed) {
          io.to(battle.id).emit('update battle', {...battleData})
          await Battle.findByIdAndUpdate(battle._id, battleData).catch(err => console.log(err.reason))
    
          //if turn was missed
          if (battleData.users[index].turnTimer === 0) {
            battleData.winner = battleData.users.find((user, currentIndex) => currentIndex != index).username
            battleData.users[0].canMove = false
            battleData.users[1].canMove = false
            io.to(battle.id).emit('finish battle', battleData)
            await Battle.findByIdAndDelete(battle._id)
            clearInterval(data.turnTimer)
            socket.disconnect(true)
          }
        }
        }, 1000)
        
         
        roomsData.set(battle.id, data)
    } else {
            console.log(index)
            console.log(battleData)
        }
    })

    socket.on('turn timer stop', async (battleData) => {
        console.log('turn timer stop')
            clearInterval(roomsData.get(battle.id).turnTimer)

            delete battleData.users[0].turnTimer
            delete battleData.users[1].turnTimer
            io.to(battle.id).emit('update battle', battleData)
            
            await Battle.findByIdAndUpdate(battle._id, battleData).catch(err => console.log(err.reason))
            
    })
})
server.listen(port, () => console.log(`Listening on port ${port}`))

