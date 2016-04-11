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
  var b = reduce.create({ basedir: basedir })

  return reduce.src('page/**/index.js', { cwd: basedir })
    .pipe(reduce.bundle(b, { common: 'common.js' }))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(reduce.dest('build'))
})

gulp.task('watch', ['clean'], function () {
  var basedir = path.join(__dirname, 'src')
  var b = reduce.create({ basedir: basedir })
  b.on('log', console.log.bind(console))

  return reduce.src('page/**/index.js', { cwd: basedir })
    .pipe(reduce.watch(b, { common: 'common.js' }))
    .on('bundle', function (vinylStream) {
      vinylStream
        .pipe(buffer())
        .pipe(uglify())
        .pipe(reduce.dest('build'))
    })
})

