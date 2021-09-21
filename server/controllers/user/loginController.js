import User from "../../models/user.js"
import bcrypt from 'bcryptjs'
import isEmail from 'isemail'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import {
  addJwtCookie
} from '../../utils/jwt.js'
import mailto from '../../configs/mailto.js'

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
  const hasdPsw = await bcrypt.hash(password, 12).catch(err => res.status(400).send('Password is required'))
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
    .then(() => {
        //send email link token
  let token_mail_verification = addJwtCookie(res, user._id);
  //let token_mail_verification = '12jhjhdsjahdu2y3ud2'
  let link = `Clik on link to continued registration http://localhost:5000/users/verify?"${token_mail_verification}`;
  let linkhtml = `Clik on link to continued registration <a href src="localhost:5000/users/verify?id=${token_mail_verification}">Link</a><br>
  Clik on link to continued registration http://localhost:5000/users/verify?id=${token_mail_verification}`;
  mailto(email, link, linkhtml);
      res.status(200).send('Sign up successful')
    }).catch((err) => 
      res.status(400).send(err.message.split(': ').slice(-1)[0])
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
  
   //check status active
  const statusUser = user.active;
  if(statusUser == false) {
    res.status(401).send('User not activeted');
  }
  else{
    addJwtCookie(res, user._id)

    res.status(200).send('Log in successful')
  }


 
};


export const logout = (req, res) => {
  res.clearCookie('jwt')
  res.status(200).send('Log out successful');
};