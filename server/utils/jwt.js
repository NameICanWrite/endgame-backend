import jwt from 'jsonwebtoken'
import { promisify } from 'util'



export const addJwtCookie = (res, value) => {
  const token = jwt.sign({ id: value }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_SECRET_IN
  })

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 3600 * 1000),
    httpOnly: true
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions);
  return token;
}

export async function jwtParser(req, res, next) {
  let token
  if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    return res.send('cookies doesnt contain token')
  }
  req.decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  next()
}
