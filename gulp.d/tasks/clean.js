import fs from 'fs-extra'

/**
 * Remove files and directories
 */
export default (files) => async () => {
  for (const filePath of files) {
    await fs.remove(filePath)
  }
}
