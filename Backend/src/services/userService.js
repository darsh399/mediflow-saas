import User from '../model/User.js';
export const createUser = async (userData) => {
   try{
        const newUser = new User(userData);
        return await newUser.save();
   }catch(error){
      console.error("Error creating user:", error);
      throw error;
   }
};

export default { createUser };
