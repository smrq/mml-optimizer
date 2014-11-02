var extend = require('extend');
var optionAliases = require('./lib/optionAliases');
var parse = require('./lib/parse');
var optimize = require('./lib/optimize');
var generate = require('./lib/generate');

var defaultOptions = optionAliases.aa;

function opt(mml, options) {
	var parsed = parseMml(mml, options);
	var optimized = optimizeMml(parsed, options);
	var generated = generateMml(optimized, options);
	return generated;
}

function parseMml(mml, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var parserOptions = extend({}, getOptions(options.input), {
		tpqn: outputOptions.tpqn,
		minimumNoteDuration: outputOptions.tpqn,
		transpose: options.transpose || 0
	});
	var parsed = parse(mml, parserOptions);
	return parsed;
}

function optimizeMml(tokens, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var optimized = optimize(tokens, outputOptions);
	return optimized;
}

function generateMml(tokens, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var generated = generate(tokens, outputOptions);
	return generated;
}

function getOptions(alias) {
	if (!alias)
		return defaultOptions;
	return optionAliases[alias] || defaultOptions;
}

module.exports = opt;
module.exports.parse = parseMml;
module.exports.optimize = optimizeMml;
module.exports.generate = generateMml;
module.exports.getOptions = getOptions;
