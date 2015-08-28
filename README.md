# gulp-watchify-factor-bundle
Use [watchify](https://www.npmjs.com/package/watchify) and [factor-bundle](https://www.npmjs.com/package/factor-bundle) in gulp.

## Usage

gulpfile.js:

```javascript
var bundler = require('gulp-watchify-factor-bundle');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var browserify = require('browserify');

var fixtures = path.resolve.bind(path, __dirname, 'src', 'page');

var entries = [
  fixtures('blue/index.js'),
  fixtures('red/index.js')
];

var b = browserify({
  entries: entries,
});

var bundle = bundler(b,
  // options for factor bundle.
  {
    entries: entries,
    outputs: [ 'blue.js', 'red.js' ],
    common: 'bundle.js',
  },
  // more transforms. Should always return a stream.
  function (bundleStream) {
    return bundleStream
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))

      // `optional`. use `buffer()` to make `stream not support` gulp plugins work
      .pipe(buffer())

      // use more gulp plugins here
      .pipe(uglify())

      .pipe(gulp.dest('./build'))
  }
);

b.on('log', gutil.log);
// normal bundle task
gulp.task('default', bundle);
// watchify bundle task
gulp.task('watch', bundler.watch(bundle));


```

## bundle = bundler(b, factorOpts, task)

Return a new gulp task callback.

### b

Type: `Browserify`


### factorOpts

Type: `Object`

`factorOpt` will be passed to [factor-bundle](https://www.npmjs.com/package/factor-bundle).

#### common

Type: `String`
Default: `common.js`

The name of the common bundle.

#### outputs

Type: `Array`

`required`

Paths of output files.
Relative to `DEST` in `gulp.dest(DEST)`.
It should pair with `facotrOpts.entries`.

#### theshold

Type: `Number`, `Function`

See [factor-bundle](https://www.npmjs.com/package/factor-bundle).

## watchBundle = bundler.watch(bundle, watchifyOpts)

`b._options.cache` and `b._options.pachageCache` will be added if not exiting.

Return a watchify gulp task callback.

`bundle` is created with `bundler`.

