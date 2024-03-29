import Battle from "../models/battle.js"
import User from "../models/user.js"
import { giveCards } from "../utils/battleTools.js"


export const startBattle = async (req, res) => {
    const {
        username,
        _id
    } = await User.findById(req.decoded.id)
    let currentUser = {
        _id,
        username,
        hp: 20,
    }
    // console.log('starting battle...')

    currentUser = giveCards(currentUser)

    let battle = await Battle.findOne({
        "users.1": {
            $exists: false
        }
    })
    if (battle) {
        //check if user isn't in battle already
        if (!battle.users.some(user => user.username == currentUser.username)) {
            currentUser.canMove = !battle.users[0].canMove
            await Battle.updateOne({
                _id: battle._id
            }, {
                $set: {
                    users: [...battle.users, currentUser]
                }
            })
            battle = await Battle.findById(battle._id)
        }
    } else {
        currentUser.canMove = !!Math.floor(Math.random())
        battle = new Battle({
            users: [currentUser],
            winner: 'unknown'
        })
        await battle.save()
    }

    setTimeout(async () => {
        battle = await Battle.findById(battle._id)
        if (battle?.users.length < 2) {
            await Battle.deleteOne({
                _id: battle.id
            })
        }
    }, 120000)
    res.send('Waiting for the other user')
}