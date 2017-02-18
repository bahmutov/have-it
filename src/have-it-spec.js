'use strict'

/* global describe, it */
describe('have-it', () => {
  const haveIt = require('.')
  it('write this test', () => {
    console.assert(haveIt, 'should export something')
  })
})
