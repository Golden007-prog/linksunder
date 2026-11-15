const fs = require('node:fs');
const path = require('node:path');
module.exports = async function verifyBundledBrowser(context) {
  const directory = path.join(context.appDir, 'build', 'browsers');
  if (!fs.existsSync(directory))
    throw new Error('Bundled Chromium is missing. Run npm run desktop:browser before packaging.');
  const files = fs.readdirSync(directory, { recursive: true });
  if (!files.some((file) => /[/\\]chrome(?:\.exe)?$/.test(file)))
    throw new Error('The desktop package must contain a complete Chromium executable.');
};
