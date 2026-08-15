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

  // Enforce employeeId uniqueness (guards the generateEmployeeId race).
  // Renumber any pre-existing duplicates first so the index can build.
  const employees = mongoose.connection.collection("employees");
  const dups = await employees
    .aggregate([
      { $group: { _id: "$employeeId", ids: { $push: "$_id" } } },
      { $match: { _id: { $ne: null }, "ids.1": { $exists: true } } },
    ])
    .toArray();
  if (dups.length) {
    let maxInt = 0;
    const allIds = await employees.distinct("employeeId");
    for (const id of allIds) {
      if (/^\d+$/.test(String(id))) {
        maxInt = Math.max(maxInt, parseInt(id, 10));
      }
    }
    let renumbered = 0;
    for (const dup of dups) {
      const [, ...rest] = dup.ids;
      for (const id of rest) {
        maxInt += 1;
        await employees.updateOne({ _id: id }, { $set: { employeeId: String(maxInt) } });
        renumbered += 1;
      }
    }
    console.log(`Renumbered ${renumbered} duplicate employeeId value(s)`);
  }
  await employees.createIndex(
    { employeeId: 1 },
    { unique: true, name: "employeeId_1" }
  );

  // Cast leave quota fields from string to number (schema changed to Number).
  await employees.updateMany(
    {
      $or: [
        { Sick: { $type: "string" } },
        { Casual: { $type: "string" } },
        { Paid: { $type: "string" } },
        { Unpaid: { $type: "string" } },
      ],
    },
    [
      {
        $set: {
          Sick: { $convert: { input: "$Sick", to: "int", onError: null, onNull: "$Sick" } },
          Casual: { $convert: { input: "$Casual", to: "int", onError: null, onNull: "$Casual" } },
          Paid: { $convert: { input: "$Paid", to: "int", onError: null, onNull: "$Paid" } },
          Unpaid: { $convert: { input: "$Unpaid", to: "int", onError: null, onNull: "$Unpaid" } },
        },
      },
    ]
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
