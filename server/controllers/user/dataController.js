import User from "../../models/user.js"


//property decoded is created by jwtParser() from utils

export async function getUserData(req, res, next) {
    const user= await User.findById(req.decoded.id);
    res.send(user)
  };

export async function setUserData(req, res) {
    const data = req.body
    await User.updateOne({_id: req.decoded.id}, {
        $set: { data }
    })
    res.send('User data set successfully')
}

  export async function getAllUsers (req, res) {
      const users = await User.find();
      res.send(users)
  };