const fs = require("fs");
const path = require("path");

const distIndexPath = path.join(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(distIndexPath)) {
  console.warn(`[strip-crossorigin] dist/index.html not found: ${distIndexPath}`);
  process.exit(0);
}

let html = fs.readFileSync(distIndexPath, "utf8");

// Vite may emit `crossorigin` attributes on module <script> and <link rel="stylesheet">.
// In some WKWebView/Capacitor setups this can lead to resources being blocked => blank screen.
html = html.replace(/\s+crossorigin(\s*=\s*(".*?"|'.*?'))?/g, "");

fs.writeFileSync(distIndexPath, html, "utf8");

console.log("[strip-crossorigin] Updated dist/index.html");

