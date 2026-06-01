import console from 'console'
import path from 'path'
import vfs from 'vinyl-fs'
import zip from '@vscode/gulp-vinyl-zip'

/**
 * Create a distributable bundle (ZIP file)
 * Packs all UI assets from src into a zip file in dest
 */
export default (src, dest, bundleName) => () =>
  vfs
    .src('**/*', { base: src, cwd: src, dot: true })
    .pipe(zip.dest(path.join(dest, `${bundleName}-bundle.zip`)))
    .on('finish', () => {
      const bundlePath = path.resolve(dest, `${bundleName}-bundle.zip`)
      if (!process.env.CI) {
        console.log(`UI bundle created: ${bundlePath}`)
        console.log(`Antora option: --ui-bundle-url=${bundlePath}`)
      }
    })
