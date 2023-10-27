import { Canvas, createCanvas, loadImage } from 'canvas';

class ImageProcessor {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    static async generateEmoteSprite(emoteUrls: string[] | null): Promise<Canvas> {
        /* Downloads the emotes and generates a sprite with them */
        // 720 x 120


        if(!emoteUrls) throw new Error('Emote urls cannot be null');

        const canvas = createCanvas(720, 120);

        const ctx = canvas.getContext('2d');

        const emoteImages = await Promise.all(emoteUrls.map(url => loadImage(url)));


        let x = 0;
        let y = 0;
        for (const emoteImage of emoteImages) {
            ctx.drawImage(emoteImage, x, y, 120, 120);
            x += 120;
        }

        return canvas

    }

}

export default ImageProcessor;