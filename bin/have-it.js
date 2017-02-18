#!/usr/bin/env node

const findAndInstall = require('..')
const name = process.argv[2]

if (!name) {
  console.error('have-it <module name to install>')
  process.exit(1)
}
console.log('have-it %s', name)
findAndInstall(name)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
