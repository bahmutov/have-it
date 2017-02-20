import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),

    commonjs({
      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false  // Default: true
    })
  ],
  entry: 'bin/have-it.js',
  dest: 'dist/have-it.js',
  format: 'cjs',
  banner: '#!/usr/bin/env node'
}
