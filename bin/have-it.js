#!/usr/bin/env node

const findAndInstall = require('..')
const name = process.argv[2]
const path = require('path')
const time = require('time-promise')

function toInstall () {
  const pkg = require(path.join(process.cwd(), 'package.json'))
  return Object.keys(pkg.dependencies || {})
}

function onError (err) {
  console.error(err)
  process.exit(1)
}

if (!name) {
  // installing all packages from package.json
  const list = toInstall()
  time(findAndInstall)(list)
    .catch(onError)
} else {
  console.log('have-it %s', name)
  time(findAndInstall)(name)
    .catch(onError)
}
