import jwt from 'jsonwebtoken';
export const createToken = (payload) => {
  try{
   if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
   const token = jwt.sign({ id: payload.id || payload._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
     return token;
  }catch(error){
     throw new Error('Error creating token: ' + error.message);
  }
 
};

export default createToken;
