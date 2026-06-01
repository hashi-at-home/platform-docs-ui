import vfs from 'vinyl-fs'
import gulpConcat from 'gulp-concat'
import { Transform } from 'stream'
import path from 'path'
import fs from 'fs-extra'

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

    // Copy vendor JS (e.g., highlight.js)
    new Promise((resolve, reject) => {
      vfs
        .src('js/vendor/**/*', opts)
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),

    // Copy fonts from node_modules
    new Promise((resolve, reject) => {
      const stream = vfs
        .src(['node_modules/@fontsource/roboto/files/**/*.woff*', 'node_modules/@fontsource/roboto-mono/files/**/*.woff*'])
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
