import mongoose from "mongoose";

const battleSchema = mongoose.Schema({
    users: [{
        username: String,
        hp: Number,
        canMove: Boolean,
        currentMove: {
            name: String,
            attack: Number,
            defence: Number
        },
        cards: [{
            name: String,
            attack: Number,
            defence: Number
        }],
        turnTimer: Number
    }],
    winner: String
});

const Battle = mongoose.model("Battle", battleSchema);

export default Battle;