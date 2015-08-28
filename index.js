var source = require('vinyl-source-stream');
var factor = require('post-factor-bundle');
var merge = require('merge-stream');
var watchify = require('watchify');
var eos = require('end-of-stream');
var mix = require('util-mix');
var noop = function () {};

module.exports = function (b, opts, moreTransforms) {
  if (typeof opts === 'function') {
    moreTransforms = opts;
    opts = {};
  }
  opts = opts || {};
  var createWriteStream = opts.createWriteStream || source;
  b.plugin(
    factor,
    mix(
      {},
      opts,
      {
        outputs: function (entries, basedir) {
          return opts.outputs.map(function (e) {
            return createWriteStream(e, basedir);
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
        createWriteStream(opts.common || 'common.js')
      )
    var bundleStream = merge(common)
      .on('error', function (err) {
        delete err.stream;
      });

    b.once('factor.pipelines', function (f, p, outputs) {
      bundleStream.add(outputs);
      var stream = bundleStream;
      if (typeof moreTransforms === 'function') {
        stream = moreTransforms(bundleStream);
      }
      eos(stream, cb || noop);
    });

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
      bundle();
    });
    bundle();
  };
};

