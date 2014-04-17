var test = require('tape');
var fixtures = require('fixtures-fs');
var path = require('path');
var fs = require('fs');

var npmShrinkwrap = require('../index.js');

var PROJ = path.join(__dirname, 'proj');
var SHA = 'e8db5304e8e527aa17093cd9de66725118d9b589';

function moduleFixture(name, version, opts) {
    opts = opts || {};

    var module = {
        'package.json': JSON.stringify({
            name: name,
            _id: name + '@' + version,
            _from: name + '@^' + version,
            version: version,
            dependencies: opts.dependencies ?
                opts.dependencies : undefined
        })
    };

    /*jshint camelcase: false*/
    if (opts.node_modules) {
        module.node_modules = opts.node_modules;
    }

    return module;
}

function gitModuleFixture(name, version, opts) {
    opts = opts || {};

    var module = {
        'package.json': JSON.stringify({
            name: name,
            _id: name + '@' + version,
            _from: 'git://github.com/uber/' + name + '#v' + version,
            _resolved: 'git://github.com/uber/' + name + '#' + SHA,
            version: version,
            dependencies: opts.dependencies ?
                opts.dependencies : undefined
        })
    };

    /*jshint camelcase: false*/
    if (opts.node_modules) {
        module.node_modules = opts.node_modules;
    }

    return module;
}

test('npmShrinkwrap is a function', function (assert) {
    assert.strictEqual(typeof npmShrinkwrap, 'function');
    assert.end();
});

test('creates simple shrinkwrap', fixtures(__dirname, {
    'proj': moduleFixture('proj', '0.1.0', {
        dependencies: {
            foo: '2.0.0'
        },
        'node_modules': {
            'foo': moduleFixture('foo', '2.0.0')
        }
    })
}, function (assert) {
    npmShrinkwrap(PROJ, function (err) {
        assert.ifError(err);

        var shrinkwrap = path.join(PROJ, 'npm-shrinkwrap.json');
        fs.readFile(shrinkwrap, 'utf8', function (err, file) {
            assert.ifError(err);
            assert.notEqual(file, '');

            var json = JSON.parse(file);

            assert.equal(json.name, 'proj');
            assert.equal(json.version, '0.1.0');
            assert.deepEqual(json.dependencies, {
                foo: {
                    version: '2.0.0',
                    resolved: 'https://registry.npmjs.org/foo/-/foo-2.0.0.tgz'
                }
            });

            assert.end();
        });
    });
}));

test('create shrinkwrap for git dep', fixtures(__dirname, {
    'proj': moduleFixture('proj', '0.1.0', {
        dependencies: {
            bar: 'git+ssh://git@github.com:uber/bar#v2.0.0'
        },
        'node_modules': {
            'bar': gitModuleFixture('bar', '2.0.0')
        }
    })
}, function (assert) {
    npmShrinkwrap(PROJ, function (err) {
        assert.ifError(err);

        var shrinkwrap = path.join(PROJ, 'npm-shrinkwrap.json');
        fs.readFile(shrinkwrap, 'utf8', function (err, file) {
            assert.ifError(err);
            assert.notEqual(file, '');

            var json = JSON.parse(file);

            assert.equal(json.name, 'proj');
            assert.equal(json.version, '0.1.0');
            assert.deepEqual(json.dependencies, {
                bar: {
                    version: '2.0.0',
                    from: 'git://github.com/uber/bar#v2.0.0',
                    resolved: 'git://github.com/uber/bar#' + SHA
                }
            });

            assert.end();
        });
    });
}));
