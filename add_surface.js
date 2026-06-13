const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Admin\\Desktop\\GyaraStich';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('colors: {') && !content.includes('surface:')) {
    content = content.replace(/colors:\s*\{/g, "colors: {\n            surface: '#FFF7EA',");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added surface color to ${file}`);
  }
});
