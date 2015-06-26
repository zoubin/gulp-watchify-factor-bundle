var source = require('vinyl-source-stream');
var xbind = require('xbind');
var factor = require('factor-bundle');
var merge = require('merge-stream');
var watchify = require('watchify');
var eos = require('end-of-stream');
var mix = require('util-mix');

module.exports = function (b, opts, moreTransforms) {
    var entries = opts.entries;
    var getOutputFiles = typeof opts.outputs === 'function'
        ? opts.outputs
        : xbind.identity(
            [].concat(opts.outputs).filter(Boolean)
        );

    var pipelines = [];
    var files = [];

    b.on('factor.pipeline', function (file, pipeline) {
        files.push(file);
        if (pipelines.push(pipeline) === entries.length) {
            b.emit('factor.pipelines', files, pipelines);
        }
    });
    b.on('factor.pipelines.reset', function () {
        files.length = 0;
        pipelines.length = 0;
    });

    b.plugin(opts.factor || factor, mix({}, opts, {
        outputs: getOutputs(entries),
    }));

    bundle._b = b;

    return bundle;

    function getOutputs(entries) {
        return getOutputFiles(entries).map(function (e) {
            var s = e;
            if (typeof e === 'string') {
                s = source(e);
                s.file = e;
            }
            return s;
        });
    }

    function bundle() {
        return new Promise(function (resolve, reject) {
            var common = b.bundle().pipe(source(opts.common || 'common.js'));

            if (pipelines.length === entries.length) {
                hook(files, pipelines);
            }
            else {
                b.once('factor.pipelines', hook);
            }

            function hook(files, pipelines) {
                var outputs = getOutputs(files);

                pipelines.forEach(function (pipeline, i) {
                    // we have to cut off the old outputs
                    pipeline.unpipe();
                    pipeline.pipe(outputs[i]);
                });
                b.emit('factor.pipelines.reset');

                var stream = merge(outputs.concat(common));
                if (typeof moreTransforms === 'function') {
                    stream = moreTransforms(stream);
                }
                eos(stream, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }
        });
    }
};

module.exports.watch = function (bundle) {
    if (!bundle._b) {
        return bundle;
    }
    return function () {
        var b = watchify(bundle._b);
        // on any dep update, runs the bundler, without `cb`
        b.on('update', xbind(bundle).xargs());
        return bundle.apply(this, arguments);
    };
};

