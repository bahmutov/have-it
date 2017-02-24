'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const snapshot = require('snap-shot')

/* global describe, it */
describe.only('findMissing', () => {
  const {findMissing} = require('./utils')

  it('is a function', () => {
    la(is.fn(findMissing))
  })

  it('finds missing deps', () => {
    const names = [{
      name: 'foo'
    }, {
      name: 'bar'
    }]
    const found = ['foo']
    const missing = findMissing(names, found)
    snapshot(missing)
  })
})
