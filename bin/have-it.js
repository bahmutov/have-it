const findAndInstall = require('..')
const name = process.argv[2]
const {toInstall} = require('../src/utils')

function onError (err) {
  console.error(err)
  process.exit(1)
}

if (!name) {
  // installing all packages from package.json
  toInstall()
    .then(findAndInstall)
    .catch(onError)
} else {
  console.log('have-it %s', name)
  findAndInstall(name)
    .catch(onError)
}
