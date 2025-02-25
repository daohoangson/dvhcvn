const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // https://stackoverflow.com/a/75871470/308114
  // https://pptr.dev/troubleshooting/#running-puppeteer-on-google-cloud-functions
  cacheDirectory: join(__dirname, "node_modules", ".puppeteer_cache"),
};
