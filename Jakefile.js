var build = require('./build/build.js'),
    lint = require('./build/hint.js');

var BOILERPLATE =
    '/* ==========================================================\n' +
    '* leafpile.js v0.1.1\n' +
    '* A marker clustering layer for Leaflet maps\n' +
    '* http://github.com/cavis/leafpile\n' +
    '* ==========================================================\n' +
    '* Copyright (c) 2012 Ryan Cavis\n' +
    '* Licensed under http://en.wikipedia.org/wiki/MIT_License\n' +
    '* ========================================================== */\n';

desc('Check Leafpile source for errors with JSHint');
task('lint', function () {

    var files = build.getFiles();

    console.log('Checking for JS errors...');

    var errorsFound = lint.jshint(files);

    if (errorsFound > 0) {
        console.log(errorsFound + ' error(s) found.\n');
        fail();
    } else {
        console.log('\tCheck passed');
    }
});

desc('Combine and compress Leafpile source files');
task('build', ['lint'], function (compsBase32, buildName) {

    var files = build.getFiles(compsBase32);

    console.log('Concatenating ' + files.length + ' files...');

    var content = build.combineFiles(files),
        newSrc = BOILERPLATE + content,

        pathPart = 'dist/leafpile' + (buildName ? '-' + buildName : ''),
        srcPath = pathPart + '-src.js',

        oldSrc = build.load(srcPath),
        srcDelta = build.getSizeDelta(newSrc, oldSrc);

    console.log('\tUncompressed size: ' + newSrc.length + ' bytes (' + srcDelta + ')');

    if (newSrc === oldSrc) {
        console.log('\tNo changes');
    } else {
        build.save(srcPath, newSrc);
        console.log('\tSaved to ' + srcPath);
    }

    console.log('Compressing...');

    var path = pathPart + '.js',
        oldCompressed = build.load(path),
        newCompressed = BOILERPLATE + build.uglify(content),
        delta = build.getSizeDelta(newCompressed, oldCompressed);

    console.log('\tCompressed size: ' + newCompressed.length + ' bytes (' + delta + ')');

    if (newCompressed === oldCompressed) {
        console.log('\tNo changes');
    } else {
        build.save(path, newCompressed);
        console.log('\tSaved to ' + path);
    }
});

task('default', ['build']);
