const dns = require("dns").promises;

module.exports = async (req, res) => {
  try {
    const srv = await dns.resolveSrv("_mongodb._tcp.0.hvcrl3y.mongodb.net");
    return res.json({ srv });
  } catch (err) {
    return res.json({ error: err.message, stack: err.stack });
  }
};
