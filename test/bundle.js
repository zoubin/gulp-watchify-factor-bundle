var reduce = require('..')
var test = require('tap').test
var fs = require('fs')
var path = require('path')
var del = require('del')
var fixtures = path.resolve.bind(path, __dirname)
var dest = fixtures.bind(null, 'build')
var expect = fixtures.bind(null, 'expected', 'multi-bundles')

test('bundle', function(t) {
  del(dest()).then(function () {
    var basedir = fixtures('src', 'multi-bundles')
    var b = reduce.create({ basedir: basedir })
    reduce.src('*.js', { cwd: basedir })
      .pipe(reduce.bundle(b, {
        entries: ['green.js', 'red.js'],
        outputs: ['green.js', 'red.js'],
        common: 'common.js',
      }))
      .pipe(reduce.dest(dest()))
      .on('finish', function () {
        t.equal(
          read(dest('common.js')),
          read(expect('common.js')),
          'common.js'
        )
        t.equal(
          read(dest('green.js')),
          read(expect('green.js')),
          'green.js'
        )
        t.equal(
          read(dest('red.js')),
          read(expect('red.js')),
          'red.js'
        )
        t.end()
      })
  })
})

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

