'use strict'

const rootFolder = process.env.HAVE || process.env.HOME

const debug = require('debug')('have-it')
const path = require('path')
const fs = require('fs')
const R = require('ramda')
const semver = require('semver')
const la = require('lazy-ass')
const is = require('check-more-types')
const glob = require('glob-all')
const execa = require('execa')

const {mkdir, saveJSON, findMissing, saveVersions} = require('./utils')

debug('using root folder %s', rootFolder)

function getVersion (folder) {
  const packageFilename = path.join(folder, 'package.json')
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(packageFilename, 'utf8', (err, s) => {
        if (err) {
          return reject(err)
        }
        const json = JSON.parse(s)
        const main = json.main || 'index.js'
        debug('main %s', main)
        const withExtension = main.endsWith('index') ? main + '.js' : main

        let fullMain = path.isAbsolute(withExtension)
          ? withExtension : path.join(folder, withExtension)

        if (!fs.existsSync(fullMain)) {
          fullMain += '.js'
        }

        if (!fs.existsSync(fullMain)) {
          const notFound = new Error(`Cannot find main file ${fullMain}`)
          return reject(notFound)
        }
        return resolve({
          folder: folder,
          filename: packageFilename,
          name: json.name,
          version: json.version,
          main: fullMain
        })
      })
    } catch (err) {
      reject()
    }
  })
}

function getVersionSafe (folder) {
  return getVersion(folder)
}

function byVersion (a, b) {
  return semver.compare(a.version, b.version)
}

const latestVersion = R.pipe(
  R.sort(byVersion),
  R.last
)

// TODO return found / not found modules
function findModules (names) {
  la(is.strings(names), 'expected names', names)
  const searches = names.map(name => `${rootFolder}/*/node_modules/${name}`)
  const folders = glob.sync(searches)
  return Promise.all(folders.map(getVersionSafe))
    .then(R.filter(R.is(Object)))
    .then(R.groupBy(R.prop('name')))
    .then(R.mapObjIndexed(latestVersion))
    .then(found => {
      const foundNames = R.keys(found)
      const missing = findMissing(names, foundNames)
      if (is.not.empty(missing)) {
        console.log('You do not have %d module(s): %s',
          missing.length, missing.join(', '))
        debug('all names to find', names)
        debug('found names', foundNames)
        debug('missing names', missing)
      }
      return {
        missing,
        found
      }
    })
}

function print (modules) {
  const different = R.uniqBy(R.prop('version'))(modules)
  debug('%d different version(s)', different.length)
  debug(R.project(['version'], different))
}

function installMain (p) {
  if (!p) {
    console.error('nothing to install')
    // TODO: use real NPM install in this case
    return
  }
  const destination = path.join(process.cwd(), 'node_modules', p.name)
  debug('installing', p)
  debug('as', destination)

  return mkdir(destination)
    .then(() => {
      const pkg = {
        name: p.name,
        main: p.main,
        version: p.version,
        description: 'fake module created by \'have-it\' pointing at existing module'
      }
      const filename = path.join(destination, 'package.json')
      return saveJSON(filename, pkg)
    }).then(R.always(p))
}

const saveDependencies = options =>
  options.includes('-S') || options.includes('--save')

const saveDevDependencies = options =>
  options.includes('-D') || options.includes('--save-dev')

function haveModules (list, options) {
  la(is.strings(options), 'expected list of options', options)

  const nameAndVersion = R.project(['name', 'version'])(list)

  return Promise.all(list.map(installMain))
    .then(() => {
      list.forEach(p => {
        console.log(`have ${p.name}@${p.version}`)
      })
    })
    .then(() => {
      if (saveDependencies(options)) {
        debug('saving as dependencies in package.json')
        saveVersions(nameAndVersion)
      } else if (saveDevDependencies(options)) {
        debug('saving as devDependencies in package.json')
        saveVersions(nameAndVersion, true)
      }
    })
}

function npmInstall (list, options) {
  if (is.empty(list)) {
    return Promise.resolve()
  }
  const flags = options.join(' ')
  const names = list.join(' ')
  const cmd = `npm install ${flags} ${names}`
  console.log(cmd)
  return execa.shell(cmd)
}

const installModules = options => ({found, missing}) => {
  la(is.object(found), 'expected found modules object', found)
  la(is.strings(missing), 'expected list of missing names', missing)
  const list = R.values(found)

  return haveModules(list, options)
    .then(() => npmInstall(missing, options))
}

function findAndInstall (names, options) {
  if (is.string(names)) {
    names = [names]
  }
  la(is.array(names), 'expected list of names to install', names)

  return findModules(names)
    .then(R.tap(print))
    .then(installModules(options))
}

module.exports = findAndInstall

// findAndInstall(['lodash', 'debug'])
//   .then(console.log)
