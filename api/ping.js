module.exports = (req, res) => {
  try {
    const app = require("../app");
    return res.status(200).json({
      status: "ok",
      appType: typeof app,
      views: app.get("views"),
      cwd: process.cwd(),
      dirname: __dirname,
      hasAtlas: !!process.env.ATLASDB_URL,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
};
