# gulp-watchify-factor-bundle
Use [watchify](https://www.npmjs.com/package/watchify) and [factor-bundle](https://www.npmjs.com/package/factor-bundle) in gulp

## Usage

gulpfile.js:

```javascript
var wrap = require('..');
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

var bundle = wrap(b,
  // options for factor bundle.
  {
    entries: entries,
    outputs: [ 'blue.js', 'red.js' ],
    common: 'common.js',
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
gulp.task('watch', wrap.watch(bundle));

```

## bundle = wrap(b, factorOpts, task)

Return a new gulp task callback.

### b

Type: `Browserify`


### factorOpts

Type: `Object`

`factorOpt` will be passed to [post-factor-bundle](https://github.com/zoubin/post-factor-bundle).

#### common

Type: `String`
Default: `common.js`

The name of the common bundle.

#### outputs

Type: `Array`

`required`

Paths of output files.
It should pair with `facotrOpts.entries`.

#### more

See [post-factor-bundle](https://github.com/zoubin/post-factor-bundle).


## watchBundle = wrap.watch(bundle, watchifyOpts)

`b._options.cache` and `b._options.pachageCache` will be added if not exiting.

Return a watchify gulp task callback.

`bundle` is created with `wrap`.

