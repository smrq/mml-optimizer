#!/usr/bin/env node

var program = require('commander');
var pkg = require('./package.json');
var opt = require('./index');

program
	.version(pkg.version)
	.option('-i, --in [format]', 'Define the input MML format.', 'aa')
	.option('-o, --out [format]', 'Define the output MML format.', 'aa');

program.on('--help', function () {
	console.log('  Supported formats:');
	console.log();
	console.log('    aa                  ArcheAge (default)');
	console.log('    mabi                Mabinogi');
});

program.parse(process.argv);

var optimized = opt(program.args.join(), { input: program.in, output: program.out });
process.stdout.write(optimized);
