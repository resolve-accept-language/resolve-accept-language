import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { EOL } from 'node:os'
import path from 'node:path'

import { transformSync } from '@swc/core'
import { minify_sync as minify } from 'terser'

/** Matches ESM/CJS build files (`.js` and `.d.ts`). */
const REGEX_ESM_BUILD_FILES = /\.(d\.ts|js)$/

/** Matches JavaScript files (`.js`). */
const REGEX_JS_FILES = /\.js$/

/** Matches import/require paths without file extensions that need ESM extensions added. */
const REGEX_EXTENSIONLESS_IMPORTS =
  /(?<importClause>from\s*|import\s*)(?<quote>["'])(?<modulePath>(?!.*\.(js|ts))(\.|\.?\.\/.*?)\.?)(\k<quote>)/gm

/**
 * Get all file paths matching a pattern from a directory (recursively).
 *
 * @param directoryPath - The path to the directory to search.
 * @param filePattern - A regex pattern to match file names against.
 *
 * @returns An array of matching relative file paths.
 */
const getFilePaths = (directoryPath: string, filePattern: RegExp): string[] =>
  readdirSync(directoryPath, { withFileTypes: true }).reduce<string[]>((files, entry) => {
    const absoluteEntryPath = path.resolve(directoryPath, entry.name)
    const relativeEntryPath = path.relative(process.cwd(), absoluteEntryPath)
    if (entry.isDirectory()) {
      return [...files, ...getFilePaths(absoluteEntryPath, filePattern)]
    } else if (entry.isFile() && filePattern.test(absoluteEntryPath)) {
      return [...files, relativeEntryPath]
    }
    return files
  }, [])

/**
 * +-----------------------------------------------------------------+
 * |                     Add ESM file extensions                     |
 * +-----------------------------------------------------------------+
 */

console.log(`${EOL}🏃 Running build step: add ESM file extensions.${EOL}`)

for (const filePath of getFilePaths('dist/esm', REGEX_ESM_BUILD_FILES)) {
  const fileContent = readFileSync(filePath, 'utf8')
  REGEX_EXTENSIONLESS_IMPORTS.lastIndex = 0
  const newFileContent = fileContent.replaceAll(
    REGEX_EXTENSIONLESS_IMPORTS,
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
}

/**
 * +------------------------------------------------------------------+
 * |                   Downlevel ES2015 to ES5 (SWC)                  |
 * +------------------------------------------------------------------+
 */

console.log(`${EOL}🏃 Running build step: downlevel ESM ES2015 → ES5 via SWC.${EOL}`)

for (const filePath of getFilePaths('dist/esm', REGEX_JS_FILES)) {
  const result = transformSync(readFileSync(filePath, 'utf8'), {
    jsc: { target: 'es5', parser: { syntax: 'ecmascript' } },
    module: { type: 'es6' },
  })
  console.log(`   ⬇️  Downleveling: ${filePath}`)
  writeFileSync(filePath, result.code)
}

/**
 * +------------------------------------------------------------------+
 * |                  Generate CJS build from ESM (SWC)               |
 * +------------------------------------------------------------------+
 */

console.log(`${EOL}🏃 Running build step: generate CJS from ESM via SWC.${EOL}`)

// Copy the entire ESM output (JS + declarations) to dist/cjs.
mkdirSync('dist/cjs', { recursive: true })
cpSync('dist/esm', 'dist/cjs', { recursive: true })

// Convert ESM JavaScript to CommonJS via SWC.
for (const filePath of getFilePaths('dist/cjs', REGEX_JS_FILES)) {
  const result = transformSync(readFileSync(filePath, 'utf8'), {
    jsc: { parser: { syntax: 'ecmascript' } },
    module: { type: 'commonjs' },
  })
  console.log(`   🔄 Converting to CJS: ${filePath}`)
  writeFileSync(filePath, result.code)
}

// Mark the CJS directory so Node.js treats .js files as CommonJS.
writeFileSync('dist/cjs/package.json', '{ "type": "commonjs" }')

/**
 * +----------------------------------------------------------------+
 * |                          Minify build                          |
 * +----------------------------------------------------------------+
 */

const minifyBuildDirectoryPaths = ['dist/cjs', 'dist/esm']

console.log(`${EOL}🏃 Running build script: minify build.${EOL}`)

for (const buildDirectoryPath of minifyBuildDirectoryPaths) {
  for (const filePath of getFilePaths(buildDirectoryPath, REGEX_JS_FILES)) {
    const result = minify(readFileSync(filePath, 'utf8'))
    if (result?.code === undefined) {
      throw new Error('Minification failed')
    }
    console.log(`   📦 Minifying file: ${filePath}`)
    writeFileSync(filePath, result.code)
  }
}

/**
 * +------------------------------------------------------------------+
 * |                       Delete build scripts                       |
 * +------------------------------------------------------------------+
 */

console.log(`${EOL}🏃 Running build script: delete build scripts.${EOL}`)

rmSync('dist/build-scripts', { recursive: true, force: true })
