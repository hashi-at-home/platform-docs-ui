import deviconMapper from './postcss-devicons-mapper.js'
// import postcssImport from 'postcss-import'
import postcssUrl from 'postcss-url'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssCalc from 'postcss-calc'

export default {
  plugins: [
    // postcssImport({ skipDuplicates: true }),
    deviconMapper(),
    postcssUrl,
    postcssCustomProperties,
    postcssCalc,
  ],
}
