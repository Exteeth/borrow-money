const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourcePath = '/home/exteeth/.gemini/antigravity-ide/brain/9e4eca3d-1bca-44a5-9d01-f90899fba585/app_icon_wisdom_nk_1782315490119.png';
const dest192 = path.join(__dirname, '../public/icons/icon-192x192.png');
const dest512 = path.join(__dirname, '../public/icons/icon-512x512.png');

async function resize() {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file not found at ${sourcePath}`);
      return;
    }
    
    // Create destination folder if not exists
    const iconsDir = path.dirname(dest192);
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    console.log('Resizing 512x512...');
    await sharp(sourcePath)
      .resize(512, 512)
      .toFile(dest512);

    console.log('Resizing 192x192...');
    await sharp(sourcePath)
      .resize(192, 192)
      .toFile(dest192);

    console.log('Icons generated successfully!');
  } catch (error) {
    console.error('Error resizing icon:', error);
  }
}

resize();
