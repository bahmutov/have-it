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
const parse = require('parse-package-name')

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
        // debug('main %s', main)
        const withExtension = main.endsWith('index') ? main + '.js' : main

        let fullMain = path.isAbsolute(withExtension)
          ? withExtension : path.join(folder, withExtension)

        let resolvedBin
        if (is.object(json.bin) && is.not.empty(json.bin)) {
          debug('resolving bin aliases')
          debug(json.bin)
          debug('with respect to folder', folder)
          const toFullBin = (value, key) =>
            path.join(folder, value)
          resolvedBin = R.mapObjIndexed(toFullBin, json.bin)
        }

        if (!fs.existsSync(fullMain)) {
          fullMain += '.js'
        }

        if (!fs.existsSync(fullMain)) {
          const notFound = new Error(`Cannot find main file ${fullMain}`)
          return reject(notFound)
        }

        const result = {
          folder: folder,
          filename: packageFilename,
          name: json.name,
          version: json.version,
          main: fullMain
        }
        if (resolvedBin) {
          result.bin = resolvedBin
        }
        return resolve(result)
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

const pickFoundVersion = target => found => {
  la(is.array(found), 'expected list of found items', found)

  if (is.not.semver(target)) {
    return latestVersion(found)
  }
  debug('need to pick version %s', target)
  debug('from list with %d found items', found.length)
  const sameVersion = R.propEq('version', target)
  return R.find(sameVersion, found)
}

// TODO unit test this
const pickFoundVersions = targets => found => {
  debug('only need the following targets', targets)

  const pickInstall = (found, name) => {
    const target = R.find(R.propEq('name', name), targets)
    const picked = pickFoundVersion(target.version)(found)
    return picked
  }

  return R.mapObjIndexed(pickInstall, found)
}

function findModules (searchNames) {
  la(is.strings(searchNames), 'expected names to find', searchNames)

  // names could potentially have version part
  const parsedNames = searchNames.map(parse)
  const names = R.pluck('name', parsedNames)
  debug('just names', names)

  const searches = names.map(name => `${rootFolder}/*/node_modules/${name}`)
  const folders = glob.sync(searches)
  return Promise.all(folders.map(getVersionSafe))
    .then(R.filter(R.is(Object)))
    .then(R.groupBy(R.prop('name')))
    .then(pickFoundVersions(parsedNames))
    .then(results => {
      const found = R.pickBy(is.object, results)
      const foundNames = R.keys(found)
      const missing = findMissing(parsedNames, foundNames)
      if (is.not.empty(missing)) {
        console.log('You do not have %d module(s): %s',
          missing.length, missing.map(R.prop('name')).join(', '))
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
  const nodeModulesFolder = path.join(process.cwd(), 'node_modules')
  const destination = path.join(nodeModulesFolder, p.name)
  debug('installing found module')
  debug(p)
  debug('as', destination)

  const linkAnyBin = () => {
    if (p.bin) {
      debug('linking bin')
      debug(p.bin)
      const binFolder = path.join(nodeModulesFolder, '.bin')
      if (!fs.existsSync(binFolder)) {
        debug('making .bin folder', binFolder)
        fs.mkdirSync(binFolder)
      }
      const linkBin = (aliasPath, alias) => {
        const binLink = path.join(binFolder, alias)
        debug(binLink, '->', aliasPath)
        fs.symlinkSync(aliasPath, binLink)
      }
      R.mapObjIndexed(linkBin, p.bin)
    } else {
      debug('nothing to link into .bin')
    }
  }

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
    })
    .then(linkAnyBin)
    .then(R.always(p))
}

const saveDependencies = options =>
  options.includes('-S') || options.includes('--save')

const saveDevDependencies = options =>
  options.includes('-D') || options.includes('--save-dev')

function haveModules (list, options = []) {
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

const fullInstallName = parsed =>
  parsed.version ? `${parsed.name}@${parsed.version}` : parsed.name

function npmInstall (list, options) {
  la(is.array(list), 'expected list of modules to npm install', list)
  la(is.strings(options), 'expected list of CLI options', options)

  if (is.empty(list)) {
    return Promise.resolve()
  }
  const flags = options.join(' ')
  const names = list.map(fullInstallName).join(' ')
  const cmd = `npm install ${flags} ${names}`
  console.log(cmd)
  return execa.shell(cmd)
}

const installModules = (options = []) => ({found, missing}) => {
  la(is.object(found), 'expected found modules object', found)
  la(is.array(missing), 'expected list of missing names', missing)

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
