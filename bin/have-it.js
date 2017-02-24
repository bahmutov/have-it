'use strict'

const findAndInstall = require('..')
const name = process.argv[2]
const {toInstall} = require('../src/utils')
const R = require('ramda')

function onError (err) {
  console.error(err)
  process.exit(1)
}

if (!name) {
  // installing all packages from package.json
  // no CLI options because the list of names in the package.json already
  toInstall()
    .then(findAndInstall)
    .catch(onError)
} else {
  const isOption = s => s.startsWith('-')
  const [options, names] = R.partition(isOption, process.argv.slice(2))
  console.log('have-it %s', names.join(' '))
  findAndInstall(names, options)
    .catch(onError)
}
