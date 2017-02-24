#!/usr/bin/env node

// useful for local testing without building
try {
  require('./have-it.js')
} catch (err) {
  console.error(err)
  console.error('Could not load ./have-it.js')
  console.error('_have alias is only meant for local development!')
  console.error('Use "have" or "have-it" please')
  process.exit(1)
}
