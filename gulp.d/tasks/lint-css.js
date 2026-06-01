import gulpStylelint from 'gulp-stylelint'
import vfs from 'vinyl-fs'

/**
 * Lint CSS files using stylelint
 */
export default (files) => (done) =>
  vfs
    .src(files)
    .pipe(
      gulpStylelint({
        reporters: [{ formatter: 'string', console: true }],
        failAfterError: true,
      })
    )
    .on('error', done)
