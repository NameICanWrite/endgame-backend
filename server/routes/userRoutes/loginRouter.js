import express from "express"
import {login, logout, signUp} from '../../controllers/user/loginController.js'

const router = express.Router();

router.post('/login', login)
router.post('/register', signUp)
router.post('/logout', logout)

export default router