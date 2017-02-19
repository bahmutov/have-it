#!/usr/bin/env node

const findAndInstall = require('..')
const name = process.argv[2]
const path = require('path')

function toInstall () {
  const pkg = require(path.join(process.cwd(), 'package.json'))
  return Object.keys(pkg.dependencies || {})
}

if (!name) {
  // installing all packages from package.json
  const list = toInstall()
  findAndInstall(list)
    .then(() => console.log('all installed'))
} else {
  console.log('have-it %s', name)
  findAndInstall(name)
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
