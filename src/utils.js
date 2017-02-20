const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const {concat, difference} = require('ramda')
const la = require('lazy-ass')
const is = require('check-more-types')

function mkdir (name) {
  return new Promise((resolve, reject) => {
    mkdirp(name, {}, (err) => {
      if (err) {
        console.error(err)
        return reject(err)
      }
      resolve()
    })
  })
}

function saveJSON (filename, json) {
  return new Promise((resolve, reject) => {
    const text = JSON.stringify(json, null, 2) + '\n\n'
    fs.writeFile(filename, text, 'utf8', (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function loadJSON (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, text) => {
      if (err) {
        return reject(err)
      }
      const json = JSON.parse(text)
      resolve(json)
    })
  })
}

function isProduction () {
  return process.env.NODE_ENV === 'production'
}

function toInstall () {
  const filename = path.join(process.cwd(), 'package.json')
  return loadJSON(filename).then(pkg => {
    const deps = Object.keys(pkg.dependencies || {})
    const devDeps = Object.keys(pkg.devDependencies || {})
    return isProduction() ? deps : concat(deps, devDeps)
  })
}

function findMissing (names, found) {
  la(is.strings(names), 'wrong names', names)
  la(is.strings(found), 'wrong installed', found)
  return difference(names, found)
}

module.exports = {
  mkdir,
  saveJSON,
  loadJSON,
  isProduction,
  toInstall,
  findMissing
}
