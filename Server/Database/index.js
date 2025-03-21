import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const ConnectDB = async () => {
  try {
    const connectURL = await mongoose.connect(process.env.URL);
    console.log("connect sccessfull", connectURL.connection.host);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default ConnectDB;
