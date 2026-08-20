import bcrypt from 'bcrypt';
export const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.saltRounds) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

export default hashPassword;
