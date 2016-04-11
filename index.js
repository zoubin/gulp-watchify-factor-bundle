var vfs = require('vinyl-fs')
var watchify = require('watchify')
var merge = require('merge-stream')
var factor = require('factor-bundle')
var source = require('vinyl-source-stream')
var Transform = require('stream').Transform

function bundler(b, opts) {
  opts = opts || {}

  var commonFile = opts.common || 'bundle.js'
  if (!Array.isArray(opts.entries)) {
    throw new Error('No entries specified for bundler')
  }
  var outputs = opts.outputs
  if (!Array.isArray(outputs)) {
    outputs = opts.entries
  }

  var outputStreams
  var bundleIndex = 0
  var outputIndex = 0
  var basedir = opts.basedir || b._options.basedir || process.cwd()
  opts.basedir = basedir

  opts.outputs = function () {
    var factors = outputs.map(function (o) {
      return source(o, basedir)
    })

    if (++outputIndex === bundleIndex) {
      outputStreams.add(factors)
      outputStreams.wait.end()
    }
    return factors
  }

  b.on('bundle', function () {
    ++bundleIndex

    var common = source(commonFile)
    var wait = through()
    outputStreams = merge([common, wait])
    outputStreams.wait = wait

    b.pipeline.push(through(
      function (buf, enc, next) {
        common.write(buf)
        next()
      },
      function (next) {
        common.end()
        var self = this
        outputStreams.on('data', function (file) {
          self.push(file)
        })
        next()
      }
    ))
  })

  b.plugin(factor, opts)
}

function watcher(b, wopts) {
  if (!b.close) {
    // Use watchify by default
    // If watchify used first, this line will be skipped
    b.plugin(watchify, wopts)
  }
  var close = b.close
  b.close = function () {
    close()
    b.emit('close')
  }
  b.start = function () {
    b.emit('bundle-stream', b.bundle())
  }
  b.on('update', b.start)
}

function through(write, end) {
  var s = Transform({ objectMode: true })
  s._transform = write || function (buf, enc, next) {
    next(null, buf)
  }
  s._flush = end
  return s
}

function bundle(b, opts) {
  var entries = []
  return through(
    function write(file, enc, next) {
      var p = file.path
      entries.push(p)
      b.add(p)
      next()
    },
    function (next) {
      opts = opts || {}
      opts.entries = opts.entries || entries
      b.plugin(bundler, opts)

      var self = this
      b.bundle()
        .on('data', function (file) {
          self.push(file)
        })
        .on('end', next)
    }
  )
}

function watch(b, opts, wopts) {
  var entries = []
  return through(
    function (file, enc, next) {
      var p = file.path
      entries.push(p)
      b.add(p)
      next()
    },
    function (next) {
      opts = opts || {}
      opts.entries = opts.entries || entries
      b.plugin(bundler, opts)
      b.plugin(watcher, wopts)

      var self = this
      b.on('bundle-stream', function (s) {
        self.emit('bundle', s)
      })
      b.once('close', next)
      b.start()
    }
  )
}

function src(patterns, opts) {
  opts = opts || {}
  if (opts.read == null) {
    opts.read = false
  }
  return vfs.src(patterns, opts)
}

module.exports = {
  bundler: bundler,
  watcher: watcher,
  bundle: bundle,
  watch: watch,
  dest: vfs.dest,
  src: src,
  create: require('browserify'),
}

