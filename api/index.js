module.exports = (req, res) => {
  try {
    const app = require("../app");
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    return res.end(`Vercel Startup Error:\n${err.message}\n\nStack:\n${err.stack}`);
  }
};
