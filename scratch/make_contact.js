const Jimp = require('jimp');

async function make() {
    const urls = [
        '1583743814966-8936f5b7be1a', 
        '1521572163474-6864f9cf17ab', 
        '1562157873-818bc0726f68', 
        '1503341504253-dff4815485f1', 
        '1529374255404-311a2a4f1fd9', 
        '1618517351616-389a55c81ce9', 
        '1598532163915-188e401ec885', 
        '1574180566232-aaad1b5b8450', 
        '1584030373081-f37b7bb4fa8e', 
        '1563729784474-d77dbb933a9e', 
        '1581655353564-df123a1eb820', 
        '1503342217505-b0a15ec3261c'
    ];
    
    const W = 200;
    const H = 300;
    const out = new Jimp(W * 4, H * 3, 0xFFFFFFFF);
    let i = 0;
    for (const id of urls) {
        try {
            const img = await Jimp.read('unsplash/' + id + '.jpg');
            img.cover(W, H);
            const x = (i % 4) * W;
            const y = Math.floor(i / 4) * H;
            out.blit(img, x, y);
            i++;
        } catch(e) {
            console.error(e);
        }
    }
    await out.writeAsync('unsplash_contact.jpg');
    console.log('Done contact sheet');
}
make();
