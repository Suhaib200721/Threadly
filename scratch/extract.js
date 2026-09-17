const fs = require('fs');
const html = fs.readFileSync('unsplash.html', 'utf8');
const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+[^"'\s]+/g;
const matches = html.match(regex);
if (matches) {
    const urls = [...new Set(matches)]
        .filter(u => u.includes('w=') && !u.includes('profile'))
        .map(u => u.split('?')[0] + '?w=600&q=80&fm=jpg');
    console.log([...new Set(urls)].slice(0, 20));
} else {
    console.log('No matches');
}
