/* global console */
/* eslint-disable no-console */

import fs from 'fs'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import postcss from 'postcss'

const plugin = () => {
  return {
    postcssPlugin: 'postcss-devicon-mapper',
    Once(root) {
      // step 1 - read the devicon codepoints from codepoints.lock.json
      // This is the authoritative source for the actual font codepoints
      const __dirname = dirname(fileURLToPath(import.meta.url))
      const codepointsPath = path.join(__dirname, 'node_modules/devicons/codepoin ts.lock.json')

      let codepoints
      try {
        const data = fs.readFileSync(codepointsPath, 'utf-8')
        codepoints = JSON.parse(data)
      } catch (err) {
        console.warn('Warning: Could not read codepoints.lock.json, skipping mapping generation.', err.message)
        return
      }

      // step 2 : convert decimal codepoints to Unicode escape sequences
      // pattern: icon name -> decimal codepoint -> "\UXXX"
      const mappings = {}
      for (const [iconName, codepoint] of Object.entries(codepoints)) {
        // Convert decimal codepoint to hex and format as Unicode escape
        const hex = codepoint.toString(16).padStart(4, '0')
        mappings[iconName] = `\\${hex}`
      }

      console.log(`[devicon-mapper] Found ${Object.keys(mappings).length} mappings from codepoints.lock.json`)

      // Step 3 - deduplicate icon names (strip "-icon" suffix to get base names)
      const baseNames = new Set()
      for (const fullName of Object.keys(mappings)) {
        const baseName = fullName.replace(/-icon$/, '')
        baseNames.add(baseName)
      }

      console.log(`[devicon-mapper] Generated ${baseNames.size} base icon names`)

      // Step 3.5: Add a base rule to override FontAwesome's font-family for all fa-devicon-* classes
      const baseRule = postcss.rule({
        selector: 'i[class*="fa-devicon-"]',
      })
      baseRule.append(postcss.decl({
        prop: 'font-family',
        value: '"Devicons" !important',
      }))
      root.append(baseRule)

      // Step 4: Create CSS rules for each icon
      let rulesCreated = 0
      for (const baseName of baseNames) {
        // Find the first available variant (prefer base, then -icon)
        let content = mappings[baseName]
        if (!content && mappings[baseName + '-icon']) {
          content = mappings[baseName + '-icon']
        }

        if (content) {
          const rule = postcss.rule({
            selector: `.icon i.fa-devicon-${baseName}::before`,
          })
          rule.append(postcss.decl({
            prop: 'content',
            value: `"${content}"`,
          }))
          root.append(rule)
          rulesCreated++
        }
      }
      console.log(`[devicon-mapper] Created ${rulesCreated} CSS rules`)
    },
  }
}

plugin.postcss = true

export default plugin
