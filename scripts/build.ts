import ImportGlobPlugin from 'esbuild-plugin-import-glob';
import * as esbuild from 'esbuild';

const rootDir = __dirname + '/..';

async function build() {
  await esbuild.build({
    entryPoints: [rootDir + '/index.ts'],
    bundle: true,
    outfile: rootDir + '/dist/index.js',
    minify: true,
    platform: 'node',
    plugins: [ImportGlobPlugin()],
    packages: 'external',
    target: ['node16']
  });
  

  console.log('Build complete!');
}

build();
