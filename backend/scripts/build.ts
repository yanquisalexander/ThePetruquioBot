import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import * as esbuild from 'esbuild'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

const __dirname = path.resolve(path.dirname(''))

async function build (): Promise<void> {
  try {
    console.log('***** Building Petruquio.LIVE *****')
    const start = Date.now()
    // Clean the dist folder
    console.log('Cleaning dist folder...')
    console.log('Removing:', __dirname + '/dist')
    await fs.rm(__dirname + '/dist', { recursive: true, force: true })
    const { errors, warnings, metafile } = await esbuild.build({
      logLevel: 'debug',
      entryPoints: [__dirname + '/index.ts'],
      bundle: true,
      platform: 'node',
      plugins: [ImportGlobPlugin()],
      packages: 'external',
      target: ['node16'],
      format: 'cjs',
      minify: true,
      outfile: __dirname + '/dist/index.cjs',
      metafile: true,
      banner: {
        js: `/******************\n * Build: ${new Date().toLocaleString()}\n ******************/\n
  
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

    const totalSize = Object.values(metafile.outputs).reduce((acc, output) => acc + output.bytes, 0)

    console.log('Total size:', (totalSize / 1024).toFixed(2), 'KB')
    console.log('Time:', Date.now() - start, 'ms')
    console.log('Build complete!') // Agrega un mensaje de registro
  } catch (error) {
    console.error('Build failed:', error) // Manejo de errores en caso de que la compilación falle
  }
}

build().catch((error) => {
  console.error('Build failed:', error)
})
