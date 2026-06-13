const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Admin\\Desktop\\GyaraStich';
const footerPath = path.join(dir, 'components', 'footer.html');
const footerHTML = fs.readFileSync(footerPath, 'utf8');

const fullFooterHTML = `<footer id="mainFooter">\n${footerHTML}\n</footer>`;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the empty footer with the full hardcoded footer
  content = content.replace('<footer id="mainFooter"></footer>', fullFooterHTML);
  
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated footer in ${file}`);
  } catch(e) {
    console.error(`Failed to update ${file}:`, e.message);
  }
}
