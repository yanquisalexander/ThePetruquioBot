import path from 'path'
import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import * as esbuild from 'esbuild'

const rootDir = path.join(__dirname, '/..')

async function build (): Promise<void> {
  try {
    const { errors, warnings } = await esbuild.build({
      logLevel: 'debug',
      entryPoints: [rootDir + '/index.ts'],
      bundle: true,
      platform: 'node',
      plugins: [ImportGlobPlugin()],
      packages: 'external',
      target: ['node16'],
      outdir: rootDir + '/dist',
      metafile: true, // Habilita la generación del archivo meta,
      banner: {
        js: `/******************\n * Build: ${new Date().toLocaleString()}\n ******************/\n
     let PETRUQUIOLIVE_COMPILED_DATE = '${new Date().toLocaleString()}'\n   
  
`
      }
    })

    // Handle errors and warnings
    if (errors.length > 0) {
      console.error('Build failed with errors:')
      errors.forEach((error) => { console.error(error) })
      return
    }

    if (warnings.length > 0) {
      console.warn('Build completed with warnings:')
      // warnings.forEach((warning) => { console.warn(warning) })
    }

    console.log('Build complete!') // Agrega un mensaje de registro
  } catch (error) {
    console.error('Build failed:', error) // Manejo de errores en caso de que la compilación falle
  }
}

build().catch((error) => {
  console.error('Build failed:', error)
})
