const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../frontend/public/images');

const S1_PATH = 'C:/Users/MD Suhaib Hussain KK/.gemini/antigravity-ide/brain/36e02aa6-2c3f-454f-96b3-b617dcd6dbaf/white_tshirt_1789212795837.jpg';
const S2_PATH = 'C:/Users/MD Suhaib Hussain KK/.gemini/antigravity-ide/brain/36e02aa6-2c3f-454f-96b3-b617dcd6dbaf/base_basic_round_white_1789214525185.jpg';
const S3_PATH = 'C:/Users/MD Suhaib Hussain KK/.gemini/antigravity-ide/brain/36e02aa6-2c3f-454f-96b3-b617dcd6dbaf/base_vneck_white_1789214537464.jpg';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r:255, g:255, b:255};
};

function getMask(img) {
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const mask = new Array(w * h).fill(0);
  
  // simple region growing from 0,0
  const queue = [{x: 0, y: 0}];
  
  // base color
  const baseColor = Jimp.intToRGBA(img.getPixelColor(0, 0));
  
  while(queue.length > 0) {
    const p = queue.pop();
    if (p.x < 0 || p.x >= w || p.y < 0 || p.y >= h) continue;
    const idx = p.y * w + p.x;
    if (mask[idx] === 1) continue;
    
    const c = Jimp.intToRGBA(img.getPixelColor(p.x, p.y));
    const dist = Math.abs(c.r - baseColor.r) + Math.abs(c.g - baseColor.g) + Math.abs(c.b - baseColor.b);
    
    // white threshold
    if (dist < 40 || (c.r > 230 && c.g > 230 && c.b > 230)) {
      mask[idx] = 1;
      queue.push({x: p.x+1, y: p.y});
      queue.push({x: p.x-1, y: p.y});
      queue.push({x: p.x, y: p.y+1});
      queue.push({x: p.x, y: p.y-1});
    }
  }
  return mask;
}

async function colorize(imgTemplate, hexColor, outName) {
  const img = imgTemplate.clone();
  const mask = getMask(img);
  const targetColor = hexToRgb(hexColor);
  
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
    const maskIdx = y * img.bitmap.width + x;
    if (mask[maskIdx] === 0) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      this.bitmap.data[idx + 0] = Math.min(255, (r * targetColor.r) / 255);
      this.bitmap.data[idx + 1] = Math.min(255, (g * targetColor.g) / 255);
      this.bitmap.data[idx + 2] = Math.min(255, (b * targetColor.b) / 255);
    }
  });
  
  const outFile = path.join(OUT_DIR, outName);
  await img.writeAsync(outFile);
  console.log(`Saved ${outName}`);
}

async function run() {
  const s1 = await Jimp.read(S1_PATH);
  const s2 = await Jimp.read(S2_PATH);
  const s3 = await Jimp.read(S3_PATH);
  
  const p1 = s1.clone().resize(1.1 * s1.bitmap.width, Jimp.AUTO).crop(s1.bitmap.width * 0.05, s1.bitmap.height * 0.05, s1.bitmap.width, s1.bitmap.height);
  const p2 = s2.clone().flip(true, false);
  const p3 = s2.clone();
  const p4 = s3.clone();
  
  const p5 = s1.clone();
  for (let y = 300; y < 450; y++) {
    for (let x = 400; x < 600; x++) {
      if (Math.sin(x/20) + Math.cos(y/20) > 0.5) p5.setPixelColor(Jimp.rgbaToInt(200, 50, 50, 255), x, y);
    }
  }

  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  const p6 = s2.clone();
  p6.print(font, 400, 350, "RETRO");
  p6.print(font, 410, 420, "1984");
  
  const p7 = s3.clone().flip(true, false);
  p7.print(font, 350, 350, "YOUR NAME");
  
  const p8 = s1.clone().flip(true, false);
  for (let y = 320; y < 380; y++) {
    for (let x = 600; x < 660; x++) {
      p8.setPixelColor(Jimp.rgbaToInt(50, 50, 200, 255), x, y);
    }
  }

  const tasks = [
    colorize(p1, '#1a1a1a', 'p1_black.jpg'),
    colorize(p1, '#f5f5f5', 'p1_white.jpg'),
    colorize(p1, '#888888', 'p1_grey.jpg'),
    colorize(p2, '#556b2f', 'p2_olive.jpg'),
    colorize(p2, '#fffdd0', 'p2_cream.jpg'),
    colorize(p2, '#1a2a4a', 'p2_navy.jpg'),
    colorize(p2, '#1a1a1a', 'p2_black.jpg'),
    colorize(p3, '#f5f5f5', 'p3_white.jpg'),
    colorize(p3, '#1a1a1a', 'p3_black.jpg'),
    colorize(p3, '#1a2a4a', 'p3_navy.jpg'),
    colorize(p3, '#cc3333', 'p3_red.jpg'),
    colorize(p4, '#f5f5f5', 'p4_white.jpg'),
    colorize(p4, '#888888', 'p4_grey.jpg'),
    colorize(p4, '#1a1a1a', 'p4_black.jpg'),
    colorize(p5, '#1a1a1a', 'p5_black.jpg'),
    colorize(p5, '#f5f5f5', 'p5_white.jpg'),
    colorize(p6, '#2d2d2d', 'p6_washedblack.jpg'),
    colorize(p6, '#c2a87f', 'p6_sand.jpg'),
    colorize(p6, '#722f37', 'p6_burgundy.jpg'),
    colorize(p7, '#1a1a1a', 'p7_black.jpg'),
    colorize(p7, '#f5f5f5', 'p7_white.jpg'),
    colorize(p7, '#2255aa', 'p7_royalblue.jpg'),
    colorize(p7, '#2d6a2d', 'p7_forestgreen.jpg'),
    colorize(p8, '#1a1a1a', 'p8_black.jpg'),
    colorize(p8, '#2255aa', 'p8_royalblue.jpg'),
    colorize(p8, '#cc3333', 'p8_red.jpg'),
    colorize(p8, '#f5f5f5', 'p8_white.jpg')
  ];
  
  await Promise.all(tasks);
  console.log("All done!");
}

run().catch(console.error);
