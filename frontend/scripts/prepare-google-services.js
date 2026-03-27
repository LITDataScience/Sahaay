const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'google-services.json');
const targetPath = path.join(projectRoot, 'android', 'app', 'google-services.json');

if (!fs.existsSync(sourcePath)) {
  console.log('Skipping google-services sync because frontend/google-services.json is missing.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
console.log(`Synced google-services.json to ${targetPath}`);
