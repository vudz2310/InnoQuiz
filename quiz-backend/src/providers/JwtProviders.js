import jwt from 'jsonwebtoken'

const generateAccessToken = (data, secretOrPrivateKey, expiresIn) => {
  if (!data || !secretOrPrivateKey || !expiresIn) {
    throw new Error('Missing parameters for token generation')
  }
  return jwt.sign(data, secretOrPrivateKey, { expiresIn })
}

const verifyToken = (token, secretOrPrivateKey) => {
  return jwt.verify(token, secretOrPrivateKey)
}

export const JwtToken = {
  generateAccessToken,
  generateToken: generateAccessToken,
  verifyToken
}