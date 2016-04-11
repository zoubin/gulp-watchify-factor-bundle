var reduce = require('..')
var test = require('tap').test
var vm = require('vm')
var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')
var os = require('os')
var tmpdir = path.join((os.tmpdir || os.tmpDir)(), 'reduce-' + Math.random())
var src = path.resolve.bind(path, tmpdir, 'src')
var dest = path.resolve.bind(path, tmpdir, 'build')
var pool = {}

mkdirp.sync(tmpdir)
mkdirp.sync(src())
mkdirp.sync(dest())
write(src('c.js'), 1)

var entries = [src('a.js'), src('b.js')]
entries.forEach(function (file, i) {
  write(file, i)
})

test('watch', function(t) {
  var count = 4

  var basedir = src()
  var b = reduce.create({
    basedir: basedir,
    cache: {},
    packageCache: {},
  })
  b.once('close', function () {
    t.equal(count, 0)
    t.end()
  })

  reduce.src(['a.js', 'b.js'], { cwd: basedir })
    .pipe(reduce.watch(b, { common: 'c.js' }))
    .on('bundle', function (bundleStream) {
      bundleStream.pipe(reduce.dest(dest()))
        .on('data', function () {})
        .once('finish', function () {
          setTimeout(next, 50)
        })
    })

  function next() {
    var c = readDest('c.js')
    t.equal(
      run(c + readDest('a.js')),
      pool.a + pool.c
    )
    t.equal(
      run(c + readDest('b.js')),
      pool.b + pool.c
    )
    if (!--count) {
      return b.close()
    }
    var file = [src('c.js')].concat(entries)[count % 3]
    var k = path.basename(file, '.js')
    var n = Math.floor(Math.random() * 10) + 1 + pool[k]
    write(file, n)
  }

})

function run (s) {
  var output = 0
  vm.runInNewContext(s, {
    console: {
      log: function (msg) {
        output += +msg
      },
    },
  })
  return output
}

function write(file, n) {
  var base = path.basename(file, '.js')
  pool[base] = n
  var content = (base === 'c' ? '' : 'require("./c.js");') + 'console.log(' + n + ')' + '// ' + file
  fs.writeFileSync(file, content)
}

function readDest(file) {
  return fs.readFileSync(dest(file), 'utf8')
}

