const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // https://stackoverflow.com/a/75871470/308114
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
