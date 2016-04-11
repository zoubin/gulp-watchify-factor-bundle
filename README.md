# gulp-watchify-factor-bundle
[![version](https://img.shields.io/npm/v/gulp-watchify-factor-bundle.svg)](https://www.npmjs.org/package/gulp-watchify-factor-bundle)
[![status](https://travis-ci.org/zoubin/gulp-watchify-factor-bundle.svg)](https://travis-ci.org/zoubin/gulp-watchify-factor-bundle)
[![coverage](https://img.shields.io/coveralls/zoubin/gulp-watchify-factor-bundle.svg)](https://coveralls.io/github/zoubin/gulp-watchify-factor-bundle)
[![dependencies](https://david-dm.org/zoubin/gulp-watchify-factor-bundle.svg)](https://david-dm.org/zoubin/gulp-watchify-factor-bundle)
[![devDependencies](https://david-dm.org/zoubin/gulp-watchify-factor-bundle/dev-status.svg)](https://david-dm.org/zoubin/gulp-watchify-factor-bundle#info=devDependencies)

A sugar wrapper for [browserify], [watchify] and [factor-bundle] to work with [gulp].

## Usage

gulpfile.js:

```javascript
var reduce = require('gulp-watchify-factor-bundle')
var gulp = require('gulp')
var path = require('path')
var buffer = require('vinyl-buffer')
var uglify = require('gulp-uglify')
var del = require('del')

gulp.task('clean', function () {
  return del('build')
})

gulp.task('build', ['clean'], function () {
  var basedir = path.join(__dirname, 'src')

  // Create a browserify instance
  // same with `browserify(opts)`
  var b = reduce.create({ basedir: basedir })

  // find entries
  // same with gulp.src()
  return reduce.src('page/**/index.js', { cwd: basedir })
    // apply `factor-bundle`
    // and call b.bundle() which produces a vinyl stream now
    .pipe(reduce.bundle(b, { common: 'common.js' }))

    // apply gulp plugins to process the vinyl stream
    .pipe(buffer())
    .pipe(uglify())

    // same with gulp.dest
    .pipe(reduce.dest('build'))
})

gulp.task('watch', ['clean'], function () {
  var basedir = path.join(__dirname, 'src')

  // Create a browserify instance
  // same with `browserify(opts)`
  var b = reduce.create({ basedir: basedir })

  b.on('log', console.log.bind(console))

  // find entries
  // same with gulp.src()
  return reduce.src('page/**/index.js', { cwd: basedir })
    // apply `factor-bundle` and `watchify`
    .pipe(reduce.watch(b, { common: 'common.js' }))
    // whenever `b.bundle()` is called,
    // event 'bundle' is fired
    .on('bundle', function (vinylStream) {
      // vinylStream = b.bundle()
      vinylStream
        // apply gulp plugins to process the vinyl stream
        .pipe(buffer())
        .pipe(uglify())
        // same with gulp.dest
        .pipe(reduce.dest('build'))
    })
})


```

## Exports

### create()
Same with the [browserify] constructor.

## bundle(b, bundleOptions)
A gulp plugin to use [browserify] with [factor-bundle],
and produces a vinyl stream.

**b**

The browserify instance.

**bundleOptions**

Options for [factor-bundle].

`bundleOptions.common` specifies the path to the common bundle.
All other options are exactly the same with those consumed by [factor-bundle].

**NOTE**

`bundleOptions.outputs` must be an array of file paths.
However, if not specified, a new bundle is created for each entry,
with the same path with the entry.

## watch(b, bundleOptions, watchifyOptions)
A gulp plugin to use [browserify] with [factor-bundle] and [watchify].

**b**

The browserify instance.

**bundleOptions**

Options for [factor-bundle].

**watchOptions**

Options for [watchify].

**NOTE**
This method creates a transform to process the entry stream,
and emit a `bundle` event whenever `b.bundle()` called.

`reduce.watch().on('bundle', vinylStream => {})`

[watchify]: https://www.npmjs.com/package/watchify
[factor-bundle]: https://www.npmjs.com/package/factor-bundle
[browserify]: https://www.npmjs.com/package/browserify
[gulp]: https://www.npmjs.com/package/gulp
