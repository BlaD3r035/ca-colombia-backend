const path = require("path");
const fs = require("fs");

module.exports = function validateOrigin(req, res, next) {
  const logsFolder = path.join(__dirname, "logs");

  if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder, { recursive: true });
  }

  const logsFile = path.join(logsFolder, "logs.txt");

  const base_urls = JSON.parse(process.env.CORS_URLS || "[]");

  const allowedIps = JSON.parse(process.env.CORS_IPS|| "[]")
 
  const origin = req.get("Origin");
  const referer = req.get("Referer");

  let requestOrigin = "";

  if (origin) {
    requestOrigin = origin;
  } else if (referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch (error) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;

  if (requestOrigin && base_urls.includes(requestOrigin)) {
    return next();
  }

  if (allowedIps.includes(clientIp)) {
    
    return next();
  }

  const logLine = `[${new Date().toISOString()}] Restricted: ${requestOrigin || "unknown"} → ${req.originalUrl} | IP: ${clientIp}\n`;
  fs.appendFileSync(logsFile, logLine);

  return res.status(403).json({ error: "Forbidden" });
};
