const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const v = '4'; // Cache version

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace critical.js with critical.js?v=4
  content = content.replace(/src="js\/critical\.js(\?v=\d+)?"/g, `src="js/critical.js?v=${v}"`);
  
  // Replace script.js with script.js?v=4
  content = content.replace(/src="js\/script\.js(\?v=\d+)?"/g, `src="js/script.js?v=${v}"`);
  
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated cache-busters in ${file}`);
  } catch(e) {
    console.error(`Failed to update ${file}:`, e.message);
  }
}
