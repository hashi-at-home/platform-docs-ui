import Asciidoctor from '@asciidoctor/core'
import fs from 'fs-extra'
import handlebars from 'handlebars'
import merge from 'merge-stream'
import path from 'path'
import requireFromString from 'require-from-string'
import { Transform } from 'stream'
import vfs from 'vinyl-fs'
import yaml from 'js-yaml'

const map = (transform = () => { }, flush = undefined) =>
  new Transform({ objectMode: true, transform, flush })

const ASCIIDOC_ATTRIBUTES = {
  experimental: '',
  icons: 'font',
  sectanchors: '',
  'source-highlighter': 'highlight.js',
}

/**
 * Build preview pages from AsciiDoc sources
 */
export default (src, previewSrc, previewDest, livereload = false) => (done) => {
  const asciidoctor = Asciidoctor()

  Promise.all([
    loadSampleUiModel(previewSrc),
    toPromise(
      merge(
        compileLayouts(src),
        registerPartials(src),
        registerHelpers(src),
        copyImages(previewSrc, previewDest)
      )
    ),
  ])
    .then(async ([baseUiModel, { layouts }]) => {
      // Setup AsciiDoc extensions
      const extensions = await Promise.all(
        ((baseUiModel.asciidoc || {}).extensions || []).map(async (request) => {
          ASCIIDOC_ATTRIBUTES[request.replace(/^@|\.js$/, '').replace(/[/]/g, '-') + '-loaded'] = ''
          const extension = await import(request)
          extension.default?.register?.call(asciidoctor.Extensions)
          return extension
        })
      )
      const asciidoc = { extensions }

      // Setup components
      for (const component of baseUiModel.site.components) {
        for (const version of component.versions || []) {
          version.asciidoc = asciidoc
        }
      }

      const baseModel = { ...baseUiModel, env: process.env }
      delete baseModel.asciidoc

      return [baseModel, layouts]
    })
    .then(([baseModel, layouts]) =>
      vfs
        .src('**/*.adoc', { base: previewSrc, cwd: previewSrc })
        .pipe(
          map((file, enc, next) => {
            const siteRootPath = path.relative(path.dirname(file.path), path.resolve(previewSrc))
            const uiModel = { ...baseModel }
            uiModel.page = { ...uiModel.page }
            uiModel.siteRootPath = siteRootPath
            uiModel.uiRootPath = path.posix.join(siteRootPath, '_')

            if (file.stem === '404') {
              uiModel.page = { layout: '404', title: 'Page Not Found' }
            } else {
              const doc = asciidoctor.load(file.contents, {
                safe: 'safe',
                attributes: ASCIIDOC_ATTRIBUTES,
              })
              uiModel.page.attributes = Object.entries(doc.getAttributes())
                .filter(([name]) => name.startsWith('page-'))
                .reduce((accum, [name, val]) => {
                  accum[name.slice(5)] = val
                  return accum
                }, {})
              uiModel.page.description = doc.getAttribute('description')
              uiModel.page.layout = doc.getAttribute('page-layout', 'default')
              uiModel.page.title = doc.getDocumentTitle()
              uiModel.page.contents = Buffer.from(doc.convert())
            }

            file.extname = '.html'
            try {
              file.contents = Buffer.from(layouts.get(uiModel.page.layout)(uiModel))
              next(null, file)
            } catch (e) {
              next(transformHandlebarsError(e, uiModel.page.layout))
            }
          })
        )
        .pipe(vfs.dest(previewDest))
        .on('error', done)
        .on('finish', () => {
          if (livereload) {
            // Trigger livereload if enabled
          }
          done()
        })
    )
    .catch(done)
}

/**
 * Load the sample UI model from YAML
 */
function loadSampleUiModel(src) {
  return fs.readFile(path.join(src, 'ui-model.yml'), 'utf8').then((contents) => yaml.load(contents))
}

/**
 * Register Handlebars partials
 */
function registerPartials(src) {
  return vfs.src('partials/*.hbs', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerPartial(file.stem, file.contents.toString())
      next()
    })
  )
}

/**
 * Register Handlebars helpers
 */
function registerHelpers(src) {
  handlebars.registerHelper('resolvePage', resolvePage)
  handlebars.registerHelper('resolvePageURL', resolvePageURL)
  return vfs.src('helpers/*.js', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerHelper(file.stem, requireFromString(file.contents.toString()))
      next()
    })
  )
}

/**
 * Compile Handlebars layouts
 */
function compileLayouts(src) {
  const layouts = new Map()
  return vfs.src('layouts/*.hbs', { base: src, cwd: src }).pipe(
    map(
      (file, enc, next) => {
        const srcName = path.join(src, file.relative)
        layouts.set(file.stem, handlebars.compile(file.contents.toString(), { preventIndent: true, srcName }))
        next()
      },
      function (done) {
        this.push({ layouts })
        done()
      }
    )
  )
}

/**
 * Copy image files for preview
 */
function copyImages(src, dest) {
  return vfs
    .src('**/*.{png,svg}', { base: src, cwd: src })
    .pipe(vfs.dest(dest))
    .pipe(map((file, enc, next) => next()))
}

/**
 * Helper to resolve page references
 */
function resolvePage(spec) {
  if (spec) return { pub: { url: resolvePageURL(spec) } }
}

/**
 * Helper to resolve page URLs
 */
function resolvePageURL(spec) {
  if (spec) return '/' + (spec = spec.split(':').pop()).slice(0, spec.lastIndexOf('.')) + '.html'
}

/**
 * Transform Handlebars errors to provide better diagnostics
 */
function transformHandlebarsError({ message, stack }, layout) {
  const m = stack.match(/^ *at Object\.ret \[as (.+?)\]/m)
  const templatePath = `src/${m ? 'partials/' + m[1] : 'layouts/' + layout}.hbs`
  const err = new Error(`${message}${~message.indexOf('\n') ? '\n^ ' : ' '}in UI template ${templatePath}`)
  err.stack = [err.toString()].concat(stack.slice(message.length + 8)).join('\n')
  return err
}

/**
 * Convert stream to promise
 */
function toPromise(stream) {
  return new Promise((resolve, reject, data = {}) =>
    stream
      .on('error', reject)
      .on('data', (chunk) => chunk.constructor === Object && Object.assign(data, chunk))
      .on('finish', () => resolve(data))
  )
}
