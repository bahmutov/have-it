'use strict'

const rootFolder = process.env.HOME

const debug = require('debug')('have-it')
const path = require('path')
const fs = require('fs')
const R = require('ramda')
const semver = require('semver')
// const execa = require('execa')
const mkdirp = require('mkdirp')
const la = require('lazy-ass')
const is = require('check-more-types')
const glob = require('glob-all')

function getVersion (folder) {
  const packageFilename = path.join(folder, 'package.json')
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(packageFilename, 'utf8', (err, s) => {
        if (err) {
          return reject(err)
        }
        const json = JSON.parse(s)
        resolve({
          folder: folder,
          filename: packageFilename,
          name: json.name,
          version: json.version,
          main: path.join(folder, json.main)
        })
      })
    } catch (err) {
      reject()
    }
  })
}

function getVersionSafe (folder) {
  return getVersion(folder).catch(() => undefined)
}

function byVersion (a, b) {
  return semver.compare(a.version, b.version)
}

// function folderSearch (name) {
//   const args = [rootFolder, '-maxdepth', '4', '-type', 'd', '-name', name]
//   return execa('find', args).then(result => result.stdout.split('\n'))
// }

// function findModule (name) {
//   const fullLine = `node_modules/${name}`
//   return folderSearch(name)
//     .then(lines => lines.filter(line => line.includes(fullLine)))
//     .then(folders => Promise.all(folders.map(getVersionSafe)))
//     .then(R.filter(R.is(Object)))
//     .then(R.sort(byVersion))
// }

const latestVersion = R.pipe(
  R.sort(byVersion),
  R.last
)

function findModules (names) {
  la(is.strings(names), 'expected names', names)
  const searches = names.map(name =>
    `${rootFolder}/git/*/node_modules/${name}`)
  const folders = glob.sync(searches)
  return Promise.all(folders.map(getVersionSafe))
    .then(R.filter(R.is(Object)))
    .then(R.groupBy(R.prop('name')))
    .then(R.mapObjIndexed(latestVersion))
}

function print (modules) {
  const different = R.uniqBy(R.prop('version'))(modules)
  debug('%d different version', different.length)
  debug(R.project(['version'], different))
}

function installMain (p) {
  if (!p) {
    console.error('nothing to install')
    // TODO: use real NPM install in this case
    return
  }
  const destination = path.join(process.cwd(), 'node_modules', p.name)
  console.log('installing', p)
  console.log('as', destination)

  mkdirp.sync(destination)
  const pkg = {
    name: p.name,
    main: p.main,
    version: p.version,
    description: 'fake module created by \'have-it\' pointing at existing module'
  }
  const filename = path.join(destination, 'package.json')
  const json = JSON.stringify(pkg, null, 2)
  fs.writeFileSync(filename, json, 'utf8')
}

function installModules (found) {
  R.values(found).forEach(installMain)
}

function findAndInstall (names) {
  if (is.string(names)) {
    names = [names]
  }

  return findModules(names)
    .then(R.tap(print))
    .then(installModules)
}

module.exports = findAndInstall

// findModules(['lodash', 'debug', 'ramda'])
//   .then(console.log)
