import express from "express"
import {startBattle} from '../controllers/battleController.js'
import { jwtParser } from "../utils/jwt.js";

const router = express.Router();

router.post('/start', jwtParser, startBattle)

export default router