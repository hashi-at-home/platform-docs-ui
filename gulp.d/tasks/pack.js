import archiver from 'archiver'
import console from 'console'
import fs from 'fs'
import path from 'path'

/**
 * Create a distributable bundle (ZIP file)
 * Packs all UI assets from src into a zip file in dest
 * Uses archiver for proper binary file handling (fonts, images)
 */
export default (src, dest, bundleName) => () =>
  new Promise((resolve, reject) => {
    // Ensure destination directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const bundlePath = path.join(dest, `${bundleName}-bundle.zip`)
    const output = fs.createWriteStream(bundlePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    output.on('close', () => {
      if (!process.env.CI) {
        console.log(`UI bundle created: ${path.resolve(bundlePath)}`)
        console.log(`Antora option: --ui-bundle-url=${path.resolve(bundlePath)}`)
      }
      resolve()
    })

    archive.on('error', (err) => {
      reject(err)
    })

    output.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)

    // Add entire src directory to archive
    archive.directory(src, false)

    archive.finalize()
  })
