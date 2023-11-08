import ImportGlobPlugin from 'esbuild-plugin-import-glob';
import * as esbuild from 'esbuild';

const rootDir = __dirname + '/..';

async function build() {
  try {
    await esbuild.build({
      logLevel: 'debug',
      entryPoints: [rootDir + '/index.ts'],
      bundle: true,
      outfile: rootDir + '/dist/index.js',
      minify: true,
      platform: 'node',
      plugins: [ImportGlobPlugin()],
      packages: 'external',
      target: ['node16']
    });

    console.log('Build complete!'); // Agrega un mensaje de registro
  } catch (error) {
    console.error('Build failed:', error); // Manejo de errores en caso de que la compilación falle
  }
}

build();
