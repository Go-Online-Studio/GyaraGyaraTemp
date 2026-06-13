const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Admin\\Desktop\\GyaraStich';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacement = `    <div class="fixed inset-0 bg-black/15 z-40 opacity-0 invisible transition-all duration-300" id="offcanvasOverlay" aria-hidden="true"></div>
    <nav class="fixed top-0 left-0 h-screen w-[260px] md:w-[280px] bg-surface rounded-r-[48px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-50 -translate-x-full transition-transform duration-300 ease-in-out p-6 flex flex-col" id="offcanvasMenu" role="navigation" aria-label="Mobile Navigation">
      <div class="text-xl tracking-widest font-bold uppercase mb-12 mt-4 text-center w-full">GYARA GYARA</div>
      <div class="flex flex-col w-full text-center mt-4"> 
        <a href="index.html" data-nav="home" class="uppercase text-[18px] font-medium tracking-[0.02em] border-b border-black/20 pb-4 mb-6 hover:opacity-75 transition-opacity">HOME</a>
        <a href="shop_now.html" data-nav="shop" class="uppercase text-[18px] font-medium tracking-[0.02em] border-b border-black/20 pb-4 mb-6 hover:opacity-75 transition-opacity">SHOP NOW</a>
        <a href="about.html" data-nav="about" class="uppercase text-[18px] font-medium tracking-[0.02em] border-b border-black/20 pb-4 mb-6 hover:opacity-75 transition-opacity">ABOUT US</a>
      </div>
    </nav>`;

const regex = /<div class="gg-offcanvas-overlay".*?<\/nav>/s;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (regex.test(content)) {
    content = content.replace(regex, replacement.trim());
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced in ${file}`);
  }
});
