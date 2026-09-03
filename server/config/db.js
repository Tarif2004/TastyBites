import mongoose from "mongoose";

let connectionPromise = null;

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection already in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI)
    .then((connection) => {
      console.log(
        `MongoDB connected: ${connection.connection.host}`
      );

      return connection;
    })
    .catch((error) => {
      connectionPromise = null;

      console.error("MongoDB connection failed:");
      console.error(error.message);

      throw error;
    });

  return connectionPromise;
};

export default connectDB;