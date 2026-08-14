import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const migrateIndexes = async () => {
  const departments = mongoose.connection.collection("departments");
  const indexes = await departments.indexes();
  const stale = indexes.find(
    (ix) =>
      ix.name === "name_1" &&
      ix.unique === true &&
      !ix.key.companyId
  );
  if (stale) {
    await departments.dropIndex("name_1");
    console.log("Dropped stale global unique index name_1 on departments");
  }
  await departments.createIndex(
    { name: 1, companyId: 1 },
    { unique: true, name: "name_1_companyId_1" }
  );
};

const ConnectDB = async () => {
  try {
    const connectURL = await mongoose.connect(process.env.URL, {
      maxPoolSize: Number(process.env.DB_POOL_SIZE) || 200,
    });
    console.log("connect sccessfull", connectURL.connection.host);
    try {
      await migrateIndexes();
    } catch (error) {
      console.error("Index migration failed (continuing):", error.message);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default ConnectDB;
