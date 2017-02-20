# have-it

> The fastest NPM install does nothing because you already have it

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]

If you have lots of local projects each with its own `node_modules` folder
you probably already have a huge number of installed NPM packages. If you
are offline or hate waiting, you can "install" a module from another folder
into the current one using dummy "proxy" module. The setup is almost instant!

Watch in action: [NPM vs Yarn vs have-it](https://www.youtube.com/watch?v=A0o1kC3d_Co)

## Example

1. Install `have-it` globally with `npm i -g have-it`. This tool will be
  available under `have` and `have-it` names.

2. Set root folder for top level search. For example my projects are usually
in `$HOME/git` folder. Thus I set `export HAVE=$HOME/git`. By default it
will use `$HOME` value as the root.

```
$HOME
  /git
    /projectA
      /node_modules
    /projectB
      /node_modules
    /projectC
      /node_modules
```

3. Install something with `have <name>`. For example

```sh
$ time have lodash
have-it lodash
have 1 module(s)
lodash@4.17.4

real  0m0.240s
```

For comparison `$ time npm i lodash` prints `real 0m1.909s` - a speed up
of 10 times!

## Installing dependencies from package.json

Just run `have` to install dependencies from the `package.json` file.

## Fallback

If a module cannot be found locally, `have-it` falls back to using
`npm install` command.

## Related projects

* [copi](https://github.com/bahmutov/copi) - physically copies found package
  into this folder
* [local-npm](https://github.com/nolanlawson/local-npm) - Local and
  offline-first npm mirror (unmaintained)

## FAQ

<details>
  <summary>Why not use `npm link`</summary>
  <p>`npm link` is cumbersome and links a single package globally</p>
</details>

<details>
  <summary>Why not use symbolic links?</summary>
  <p>Symbolic links do not work if the linked package needs to load another
  one of its own packages. For example `debug` requires `ms`. If we
  link to `debug` package folder, then Node module loader fails to
  find `ms`</p>
</details>

<details>
  <summary>Why not use local NPM proxy?</summary>
  <p>Because it is (relatively) hard</p>
</details>

<details>
  <summary>What happens in production / CI?</summary>
  <p>Nothing, you just use `npm install` there</p>
</details>

### Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2017

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/have-it/issues) on Github

## MIT License

Copyright (c) 2017 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/have-it.svg?downloads=true
[npm-url]: https://npmjs.org/package/have-it
[ci-image]: https://travis-ci.org/bahmutov/have-it.svg?branch=master
[ci-url]: https://travis-ci.org/bahmutov/have-it
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
