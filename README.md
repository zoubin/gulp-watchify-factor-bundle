# gulp-watchify-factor-bundle
Use watchify and factor-bundle in gulp

## Usage

gulpfile.js:

```javascript
var wrap = require('gulp-watchify-factor-bundle');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var browserify = require('browserify');

var entries = [ src('blue/index.js'), src('red/index.js') ];
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

            // `optional`. make `stream not support` gulp plugins work
            .pipe(buffer())

            // use more gulp plugins here
            .pipe(uglify())

            .pipe(gulp.dest('./build/js'))
    }
);

b.on('log', gutil.log);
// normal bundle task
gulp.task('default', bundle);
// watchify bundle task
gulp.task('watch', wrap.watch(bundle));

function src() {
    return path.resolve.bind(path, __dirname, 'src/page').apply(null, arguments);
}
```

## bundle = wrap(b, factorOpts, task)

Return a new gulp task callback.

### b

Type: `Browserify`


### factorOpts

Type: `Object`

`factorOpt` will be passed to `factor-bundle`.
This option object  has some extra features:


#### common

Type: `String`
Default: `common.js`

The name of the common bundle.

#### outputs

Type: `Array`, `Function`

`required`

If `Array`, it should pair with `facotrOpts.entries`.
If `Function`, it receives the resolved `facotrOpts.entries` array, and should return the paired `outputs`.

#### entries

Type: `Array`

`required`

`entries` should be the same with `b._options.entries`.

## watchBundle = wrap.watch(bundle)

Return a watchify gulp task callback.

`bundle` is created with `wrap`.

