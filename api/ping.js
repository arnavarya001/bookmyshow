const mongoose = require("mongoose");

module.exports = async (req, res) => {
  const uri = process.env.ATLASDB_URL;
  if (!uri) {
    return res.json({ connected: false, reason: "No ATLASDB_URL configured in Vercel" });
  }
  const start = Date.now();
  try {
    const conn = await mongoose
      .createConnection(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      })
      .asPromise();
    const duration = Date.now() - start;
    const collections = await conn.db.listCollections().toArray();
    await conn.close();
    return res.json({
      connected: true,
      durationMs: duration,
      collections: collections.map((c) => c.name),
    });
  } catch (err) {
    const duration = Date.now() - start;
    return res.json({
      connected: false,
      durationMs: duration,
      errorName: err.name,
      errorMessage: err.message,
    });
  }
};
