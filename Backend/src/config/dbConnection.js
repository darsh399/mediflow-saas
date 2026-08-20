import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.mongoDb_Url || process.env.MONGO || process.env.DB_URI || 'mongodb://localhost:27017/mydatabase';
        console.log('Connecting to MongoDB...', mongoUri.startsWith('mongodb') ? mongoUri.split('@').pop() : mongoUri);

        const connection = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB connected: ${connection.connection.host}`);
        return connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

export default connectDb;