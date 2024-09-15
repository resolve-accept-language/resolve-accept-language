import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { EOL } from 'node:os'
import path from 'node:path'
import { minify_sync as minify } from 'terser'

/**
 * +-----------------------------------------------------------------+
 * |                     Add ESM file extensions                     |
 * +-----------------------------------------------------------------+
 */

const esmFileExtensionRegExp =
  /(?<importClause>from\s*|import\s*)(?<quote>["'])(?<modulePath>(?!.*\.(js|ts))(\.|\.?\.\/.*?)\.?)(\k<quote>)/gm
/**
 * Get all ESM file paths (`.js` and `.d.ts`) from a directory.
 *
 * @param esmBuildDirectoryPath - The path to the ESM build directory.
 *
 * @returns An array of ESM file paths.
 */
const getEsmFilePaths = (esmBuildDirectoryPath: string): string[] =>
  readdirSync(esmBuildDirectoryPath, { withFileTypes: true }).reduce<string[]>((files, entry) => {
    const absoluteEntryPath = path.resolve(esmBuildDirectoryPath, entry.name)
    const relativeEntryPath = path.relative(process.cwd(), absoluteEntryPath)
    if (entry.isDirectory()) {
      return [...files, ...getEsmFilePaths(absoluteEntryPath)]
    } else if (entry.isFile() && /\.(d\.ts|js)$/.test(absoluteEntryPath)) {
      return [...files, relativeEntryPath]
    }
    return files
  }, [])

console.log(`${EOL}🏃 Running build step: add ESM file extensions.${EOL}`)

getEsmFilePaths('lib/esm').forEach((filePath) => {
  const fileContent = readFileSync(filePath).toString()
  const newFileContent = fileContent.replace(
    esmFileExtensionRegExp,
    (_match, importClause: string, quote: string, modulePath: string) => {
      const importPath = path.resolve(path.join(path.dirname(filePath), modulePath))

      // If the path exists without any extensions then it should be a directory.
      const importPathIsDirectory = existsSync(importPath)

      if (importPathIsDirectory && !statSync(importPath).isDirectory()) {
        throw new Error(`🚨 Expected ${importPathIsDirectory} to be a directory`)
      }

      // Add the missing extension or `/index` to the path to make it ESM compatible.
      const esmPath = importPathIsDirectory ? `${importPath}/index.js` : `${importPath}.js`

      if (!existsSync(esmPath)) {
        throw new Error(`🚨 File not found: ${esmPath}`)
      }

      if (!statSync(esmPath).isFile()) {
        throw new Error(`🚨 Expected ${importPathIsDirectory} to be a file`)
      }

      const newPath = `${modulePath}${importPathIsDirectory ? '/index' : ''}.js`
      console.log(`   ➕ ${filePath}: replacing "${modulePath}" by "${newPath}"`)
      return `${importClause}${quote}${newPath}${quote}`
    }
  )

  writeFileSync(filePath, newFileContent)
})

/**
 * +----------------------------------------------------------------+
 * |                          Minify build                          |
 * +----------------------------------------------------------------+
 */

/**
 * Get all JavaScript file paths (`.js`) from a build directory.
 *
 * @param esmBuildDirectoryPath - The path to the build directory.
 *
 * @returns An array of JavaScript file paths.
 */
const getJsFilePaths = (buildDirectoryPath: string): string[] =>
  readdirSync(buildDirectoryPath, { withFileTypes: true }).reduce<string[]>((files, entry) => {
    const absoluteEntryPath = path.resolve(buildDirectoryPath, entry.name)
    const relativeEntryPath = path.relative(process.cwd(), absoluteEntryPath)
    if (entry.isDirectory()) {
      return [...files, ...getJsFilePaths(absoluteEntryPath)]
    } else if (entry.isFile() && /\.js$/.test(absoluteEntryPath)) {
      return [...files, relativeEntryPath]
    }
    return files
  }, [])

const minifyBuildDirectoryPaths = ['lib/cjs', 'lib/esm']

console.log(`${EOL}🏃 Running build script: minify build.${EOL}`)

minifyBuildDirectoryPaths.forEach((buildDirectoryPath) => {
  getJsFilePaths(buildDirectoryPath).forEach((filePath) => {
    const result = minify(readFileSync(filePath).toString())
    if (result?.code === undefined) {
      throw new Error('Minification failed')
    }
    console.log(`   📦 Minifying file: ${filePath}`)
    writeFileSync(filePath, result.code)
  })
})

/**
 * +------------------------------------------------------------------+
 * |                       Delete build scripts                       |
 * +------------------------------------------------------------------+
 */

console.log(`${EOL}🏃 Running build script: delete build scripts.${EOL}`)

rmSync('lib/build-scripts', { recursive: true, force: true })
