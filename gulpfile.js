import { parallel, series, watch } from 'gulp'
import { clean, build, buildPreviewPages, pack, serve } from './gulp.d/tasks/index.js'

const bundleName = 'ui'
const buildDir = 'build'
const previewSrcDir = 'preview-src'
const previewDestDir = 'public'
const srcDir = 'src'
const destDir = `${previewDestDir}/_`

const livereloadEnabled = process.env.LIVERELOAD === 'true'
const serverConfig = {
  host: '0.0.0.0',
  port: 5252,
  ...(livereloadEnabled && { livereload: { port: 35729 } }),
}

/**
 * Clean: Remove old builds
 */
export function cleanTask() {
  return clean(['build', 'public'])()
}

/**
 * Build: Stage UI assets to public/_
 */
export function buildTask() {
  return build(srcDir, destDir)()
}

/**
 * Build preview pages: Generate HTML from AsciiDoc
 */
export function buildPreviewPagesTask(done) {
  return buildPreviewPages(srcDir, previewSrcDir, previewDestDir, livereloadEnabled)(done)
}

/**
 * Preview build: Build assets and generate pages
 */
export const previewBuildTask = parallel(buildTask, buildPreviewPagesTask)

/**
 * Pack: Create distributable ZIP bundle
 */
export function bundlePackTask() {
  return pack(destDir, buildDir, bundleName)()
}

/**
 * Bundle build: Clean, build assets, and prepare for packaging
 */
export const bundleBuildTask = series(cleanTask, buildTask)

/**
 * Bundle: Full production build
 */
export const bundleTask = series(bundleBuildTask, bundlePackTask)

/**
 * Preview serve: Start development server
 */
export function previewServeTask(done) {
  return serve(previewDestDir, serverConfig, () => watch([srcDir, previewSrcDir], previewBuildTask))(done)
}

/**
 * Preview: Build and serve with live reload
 */
export const previewTask = series(previewBuildTask, previewServeTask)

// Default task
export { bundleTask as default }
