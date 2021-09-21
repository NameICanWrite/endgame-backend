import express from "express"
import { getUserData, setUserData, activeUser } from "../../controllers/user/dataController.js";
import { jwtParser } from "../../utils/jwt.js";

const router = express.Router();

router.get('/user-data', jwtParser, getUserData)
router.get('/verify', jwtParser, activeUser)
router.post('/user-data', jwtParser, setUserData)


export default router
