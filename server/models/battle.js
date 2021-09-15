import mongoose from "mongoose";

const battleSchema = mongoose.Schema({
    users: [{
        username: String,
        hp: Number,
        canMove: Boolean,
        currentMove: Number,
        cards: [Number]
    }],
    winner: String
});

const Battle = mongoose.model("Battle", battleSchema);

export default Battle;