const app = require("../app");

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    return res.end(`Ping caught: ${err.message}\n${err.stack}`);
  }
};
