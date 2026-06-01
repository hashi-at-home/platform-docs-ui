import log from 'fancy-log'
import PluginError from 'plugin-error'
import prettierEslint from 'prettier-eslint'
import { Transform } from 'stream'
import vfs from 'vinyl-fs'

const map = (transform) => new Transform({ objectMode: true, transform })

/**
 * Format JavaScript files using prettier-eslint
 */
export default (files) => () => {
  const report = { changed: 0, unchanged: 0 }

  return vfs
    .src(files)
    .pipe(
      map((file, enc, next) => {
        if (file.isNull()) return next()
        if (file.isStream()) {
          return next(new PluginError('gulp-prettier-eslint', 'Streaming not supported'))
        }

        const input = file.contents.toString()
        const output = prettierEslint({ text: input, filePath: file.path })

        if (input === output) {
          report.unchanged += 1
        } else {
          report.changed += 1
          file.contents = Buffer.from(output)
        }

        next(null, file)
      })
    )
    .pipe(vfs.dest((file) => file.base))
    .on('finish', () => {
      if (report.changed > 0) {
        const changed = `formatted ${report.changed} file${report.changed === 1 ? '' : 's'}`
        const unchanged = `left ${report.unchanged} file${report.unchanged === 1 ? '' : 's'} unchanged`
        log(`prettier-eslint: ${changed}; ${unchanged}`)
      } else {
        log(`prettier-eslint: left ${report.unchanged} file${report.unchanged === 1 ? '' : 's'} unchanged`)
      }
    })
}
