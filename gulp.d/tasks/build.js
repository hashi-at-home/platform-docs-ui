import vfs from 'vinyl-fs'
import gulpConcat from 'gulp-concat'
import { Transform } from 'stream'
import path from 'path'
import fs from 'fs-extra'
import browserify from 'browserify'

const map = (transform) => new Transform({ objectMode: true, transform })

/**
 * Build and stage UI assets
 * Creates merged site.js and site.css bundles, copies templates and fonts
 */
export default (src, dest) => async () => {
  const opts = { base: src, cwd: src }
  const fontDir = path.join(dest, 'font')

  // Create separate promises for each pipeline
  const pipelines = [
    // Concatenate and write JS to js/ subdirectory
    new Promise((resolve, reject) => {
      vfs
        .src(['js/+([0-9])-*.js', '!js/vendor/**'], opts)
        .pipe(gulpConcat('js/site.js'))
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Concatenate and write CSS to css/ subdirectory
    new Promise((resolve, reject) => {
      vfs
        .src('css/**/*.css', opts)
        .pipe(gulpConcat('css/site.css'))
        .pipe(
          map(async (file, enc, next) => {
            try {
              // Process CSS to rewrite font URLs from webpack aliases to relative paths
              const css = file.contents.toString('utf-8')
              const processed = css
                // Rewrite @fontsource webpack aliases to relative paths
                .replace(
                  /url\(~@fontsource\/[^/]+\/files\/([^)]+)\)/g,
                  'url(../font/$1)'
                )
              file.contents = Buffer.from(processed, 'utf-8')
              next(null, file)
            } catch (err) {
              next(err)
            }
          })
        )
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Copy helpers
    new Promise((resolve, reject) => {
      vfs
        .src('helpers/*.js', opts)
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Copy layouts
    new Promise((resolve, reject) => {
      vfs
        .src('layouts/*.hbs', opts)
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Copy partials
    new Promise((resolve, reject) => {
      vfs
        .src('partials/*.hbs', opts)
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Copy images
    new Promise((resolve, reject) => {
      vfs
        .src('img/**/*', { ...opts, allowEmpty: true })
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Bundle highlight.js with browserify
    new Promise((resolve, reject) => {
      ; (async () => {
        try {
          const vendorSrc = path.join(src, 'js/vendor')
          const vendorDest = path.join(dest, 'js/vendor')

          await fs.ensureDir(vendorDest)

          // Bundle highlight-entry.js with browserify for browser use
          const bundler = browserify(
            path.join(vendorSrc, 'highlight-entry.js'),
            { standalone: 'hljs', basedir: process.cwd() }
          )

          const outPath = path.join(vendorDest, 'highlight.js')
          const writeStream = fs.createWriteStream(outPath)

          await new Promise((resolveStream, rejectStream) => {
            bundler
              .bundle()
              .on('error', rejectStream)
              .pipe(writeStream)
              .on('finish', resolveStream)
              .on('error', rejectStream)
          })

          resolve()
        } catch (err) {
          reject(err)
        }
      })()
    }),

    // Copy fonts from node_modules
    new Promise((resolve, reject) => {
      const fontGlobs = [
        'node_modules/@fontsource/monaspace-argon/files/**/*.woff*',
        'node_modules/@fontsource/monaspace-krypton/files/**/*.woff*',
        'node_modules/@fontsource/monaspace-radon/files/**/*.woff*',
      ]
      const stream = vfs
        .src(fontGlobs)
        .pipe(
          map(async (file, enc, next) => {
            try {
              const filename = path.basename(file.path)
              const destPath = path.join(fontDir, filename)
              // Ensure directory exists
              await fs.ensureDir(fontDir)
              // Copy file
              await fs.copy(file.path, destPath)
              next(null, file)
            } catch (err) {
              next(err)
            }
          })
        )

      // Consume the stream but don't write anywhere
      stream.on('data', () => { })
      stream.on('finish', resolve)
      stream.on('error', reject)
    }),
  ]

  // Wait for all pipelines to complete
  await Promise.all(pipelines)
}
