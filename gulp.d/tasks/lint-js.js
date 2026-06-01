import eslint from 'gulp-eslint'
import vfs from 'vinyl-fs'

/**
 * Lint JavaScript files using eslint
 */
export default (files) => (done) =>
  vfs
    .src(files)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('error', done)
