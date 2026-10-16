import mongoose from "mongoose";

let isConnected = false;

// Setup connection lifecycle listeners
mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("MongoDB connection established successfully");
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("MongoDB disconnected");
});

export const connectDB = async (uri) => {
    const mongoUri = uri || process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI environment variable is not defined");
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
        });
        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

export const disconnectDB = async () => {
    try {
        if (isConnected || mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            isConnected = false;
            console.log("MongoDB connection closed cleanly");
        }
    } catch (error) {
        console.error("Error disconnecting MongoDB:", error.message);
    }
};

export default connectDB;