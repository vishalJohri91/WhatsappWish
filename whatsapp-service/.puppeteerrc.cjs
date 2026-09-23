// Skip Puppeteer's bundled Chromium download — we use the system Google Chrome
// (see CHROME_PATH / executablePath in index.js). This avoids the ~150MB download,
// which is also blocked in some sandboxed/proxied environments.
module.exports = {
  skipDownload: true,
};
