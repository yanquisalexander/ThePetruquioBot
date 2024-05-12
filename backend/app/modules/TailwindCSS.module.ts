import tailwindcss from 'tailwindcss';
import twColors from 'tailwindcss/colors';
import postcss from 'postcss';
// @ts-ignore
import postcssMinify from '@csstools/postcss-minify';

const TAILWIND_BASE = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
`;

class TailwindCSS {
    async generateCSS(html: string) {
        return postcss([
            postcssMinify(),
            tailwindcss({
                theme: {
                    colors: {
                        ...twColors
                    }
                },
                content: [
                    {
                        raw: html,
                        extension: 'html'
                    }
                ]
            })
        ]).process(TAILWIND_BASE, { from: undefined }).then(result => result.css);
    }
}

export const tailwind = new TailwindCSS();
