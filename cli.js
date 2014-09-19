#!/usr/bin/env node

var program = require('commander');
var pkg = require('./package.json');
var opt = require('./index');

program
	.version(pkg.version)
	.parse(process.argv);

var optimized = opt(program.args.join());
process.stdout.write(optimized);
