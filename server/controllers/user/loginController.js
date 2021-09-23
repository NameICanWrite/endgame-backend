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

  //save user && send response
  await user.save()
    .then(() => {
      const address = process.env.NODE_ENV == 'production' ? 'https://endgame-backend.herokuapp.com' : 'http://localhost:5000'
      
      //send email link token
      let token_mail_verification = addJwtCookie(res, user._id);
      
      let link = `Clik on link to continued registration ${address}/users/verify?"${token_mail_verification}`;
      let linkhtml = `Clik on link to continued registration <a href src="${address}/users/verify?id=${token_mail_verification}">Link</a><br>
  Clik on link to continued registration ${address}/users/verify?id=${token_mail_verification}`;
      
  process.env.CONFIRM_EMAIL 
        ? 
          mailto(email, link, linkhtml).then(() => {
            res.status(200).send('Confirmation sent')
          }).catch((err) => res.status(400).send(err.message)) 
        :
          res.status(200).send('Sign up successfully')

    }).catch((err) =>
      res.status(400).send(err.message
        //.split(': ').slice(-1)[0]
      )
    );
};


export const login = async (req, res) => {
  const {
    username,
    password
  } = req.body;

  if (!username) {
    return res.status(400).send('Name is required')
  }

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

  //check status active if needed
  const statusUser = user.active || !process.env.CONFIRM_EMAIL;
  if (statusUser == false) {
    res.status(401).send('User not activeted');
  } else {
    addJwtCookie(res, user._id)

    res.status(200).send('Log in successful')
  }



};


export const logout = (req, res) => {
  res.clearCookie('jwt')
  res.status(200).send('Log out successful');
};