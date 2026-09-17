const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    console.log('Launching puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    console.log('Navigating to Unsplash...');
    await page.goto('https://unsplash.com/s/photos/man-standing-white-t-shirt', { waitUntil: 'networkidle2' });
    
    console.log('Evaluating images...');
    const urls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const valid = imgs
            .map(i => i.src)
            .filter(src => src && src.includes('images.unsplash.com/photo-') && src.includes('w='));
        return [...new Set(valid)].slice(0, 8);
    });
    
    console.log('URLs:', urls);
    
    if (!fs.existsSync('unsplash')) fs.mkdirSync('unsplash');
    
    for (let i = 0; i < urls.length; i++) {
        const u = urls[i].split('?')[0] + '?w=600&q=80&fm=jpg'; // clean URL
        console.log('Downloading', u);
        const viewSource = await page.goto(u);
        const buffer = await viewSource.buffer();
        fs.writeFileSync(`unsplash/model_${i+1}.jpg`, buffer);
        console.log(`Saved model_${i+1}.jpg`);
    }
    
    await browser.close();
    console.log('Done');
}
run().catch(e => console.error(e));
