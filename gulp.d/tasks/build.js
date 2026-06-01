import vfs from 'vinyl-fs'
import gulpConcat from 'gulp-concat'

/**
 * Build and stage UI assets
 * Creates merged site.js and site.css bundles
 */
export default (src, dest) => async () => {
  const opts = { base: src, cwd: src }

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

    // Copy images
    new Promise((resolve, reject) => {
      vfs
        .src('img/**/*', { ...opts, allowEmpty: true })
        .pipe(vfs.dest(dest))
        .on('finish', resolve)
        .on('error', reject)
    }),
  ]

  // Wait for all pipelines to complete
  await Promise.all(pipelines)
}
