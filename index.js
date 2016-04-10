var source = require('vinyl-source-stream');
var factor = require('factor-bundle');
var merge = require('merge-stream');
var watchify = require('watchify');
var eos = require('end-of-stream');
var pick = require('util-mix').pick;
var noop = function () {};

module.exports = function (b, opts, moreTransforms) {
  if (typeof opts === 'function') {
    moreTransforms = opts;
    opts = {};
  }
  opts = opts || {};
  var bundleStream;

  b.plugin(
    factor,
    pick(
      ['outputs', 'entries', 'threshold', 'basedir'],
      opts,
      {
        outputs: function () {
          return opts.outputs.map(function (o) {
            var s = source(o);
            bundleStream.add(s);
            return s;
          });
        }
      }
    )
  );

  bundle._b = b;

  return bundle;

  function bundle(cb) {
    var common = b.bundle()
      .on('error', function (err) {
        bundleStream.emit('error', err);
      })
      .pipe(
        source(opts.common || 'common.js')
      )
    bundleStream = merge(common)
      .on('error', function (err) {
        delete err.stream;
      });

    var stream = bundleStream;
    if (typeof moreTransforms === 'function') {
      stream = moreTransforms(bundleStream);
    }
    eos(stream, cb || noop);
  }
};

module.exports.watch = function (bundle, watchifyOpts) {
  var b = bundle._b;
  return function (cb) {
    b._options.cache = b._options.cache || {};
    b._options.packageCache = b._options.packageCache || {};
    b = watchify(b, watchifyOpts);
    // on any dep update, runs the bundler, without `cb`
    b.on('update', function () {
      bundle(cb);
    });
    bundle(cb);
  };
};

