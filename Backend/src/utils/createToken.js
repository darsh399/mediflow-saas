import jwt from 'jsonwebtoken';
export const createToken = (payload, expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1h') => {
  try{
   if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign({ id: payload.id || payload._id }, process.env.JWT_SECRET, { expiresIn });
     return token;
  }catch(error){
     throw new Error('Error creating token: ' + error.message);
  }
 
};

export default createToken;
