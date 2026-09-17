const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://unsplash.com/s/photos/man-standing-white-t-shirt', { waitUntil: 'networkidle2' });
    const html = await page.content();
    fs.writeFileSync('unsplash.html', html);
    await browser.close();
}
run().catch(e => console.error(e));
