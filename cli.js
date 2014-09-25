#!/usr/bin/env node

var concat = require('concat-stream');
var fs = require('fs');
var program = require('commander');

var pkg = require('./package.json');
var opt = require('./index');

program
	.version(pkg.version)
	.option('-i, --infile [file]', 'set the filename for input (default: stdin)')
	.option('-o, --outfile [file]', 'set the filename for output (default: stdout)')
	.option('-f, --format [format]', 'set the input and output MML format')
	.option('-I, --infmt [format]', 'set the input MML format')
	.option('-O, --outfmt [format]', 'set the output MML format');

program.on('--help', function () {
	console.log('  Supported formats:');
	console.log();
	console.log('    aa         ArcheAge (default)');
	console.log('    mabi       Mabinogi');
});

program.parse(process.argv);

if (program.format && program.infmt) {
	console.error('Error: cannot use both --format and --infmt');
	process.exit(1);
}
if (program.format && program.outfmt) {
	console.error('Error: cannot use both --format and --outfmt');
	process.exit(1);
}

var options = {
	input: program.format || program.infmt || 'aa',
	output: program.format || program.outfmt || 'aa'
};

if (program.infile) {
	fs.readFile(program.infile, function (err, data) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		run(data);
	});
} else {
	process.stdin.pipe(concat(run));
}

function run(mml) {
	var optimized = opt(mml, options);
	if (program.outfile) {
		fs.writeFile(program.outfile, optimized, function (err) {
			if (err) {
				console.error(err);
				process.exit(1);
			}
		});
	} else {
		process.stdout.write(optimized);
	}
}
