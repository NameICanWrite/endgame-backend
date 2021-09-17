import User from "../../models/user.js"
import bcrypt from 'bcryptjs'
import isEmail from 'isemail'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import {
  addJwtCookie
} from '../../utils/jwt.js'

dotenv.config({
  path: './server/.env'
})


export const signUp = async (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;

  //check if user exists
  let user = await User.findOne({
    username
  });
  if (user) {
    return res.status(400).send('User already exists');
  }

  //create user
  const hasdPsw = await bcrypt.hash(password, 12);
  user = new User({
    username,
    email,
    password: hasdPsw,
    data: {
      clicks: 0
    }
  });

  //add token to response
  addJwtCookie(res, user._id)

  //save user && send response
  await user.save()
    .then(() => 
      res.status(200).send('Sign up successful')
    ).catch((err) => 
    console.log(err)
      // res.status(400).send(err.message.split(': ').slice(-1)[0])
    );
};


export const login = async (req, res) => {
  const {
    username,
    password
  } = req.body;

  if (!username) {return res.status(400).send('Name is required')}

  //find user
  let user
  if (isEmail.validate(username, {
      errorLevel: false
    }) == true) user = await User.findOne({
    email: username
  });
  else user = await User.findOne({
    username
  })
  if (!user) {
    return res.status(400).send('User doesn\'t exist');
  }

  //check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Password incorrect');
  }

  addJwtCookie(res, user._id)

  res.status(200).send('Log in successful')
};


export const logout = (req, res) => {
  res.clearCookie('jwt')
  res.status(200).send('Log out successful');
};