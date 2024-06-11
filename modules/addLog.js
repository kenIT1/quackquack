const fs = require("fs");

function addLog(msg) {
  const time = new Date().toLocaleString();
  const logStr = `${time} | ${msg}`;
  fs.appendFileSync("./log.txt", logStr, "utf-8");
}

module.exports = addLog;
