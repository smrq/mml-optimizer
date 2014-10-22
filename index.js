var core = require('./optimizer-core');
var extend = require('extend');

var optionAliases = {
	'mabi': {
		tpqn: 96,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: [8,15],
			duration: '4'
		},
		maxVolume: 15,
		supportsNoteNumbers: true,
		tracksShareState: false,
		octaveOffset: 0,
		noLiteralDottedRests: false
	},
	'aa': {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: [100,127],
			duration: '4'
		},
		maxVolume: 127,
		supportsNoteNumbers: false,
		tracksShareState: true,
		octaveOffset: -1,
		noLiteralDottedRests: true
	}
}
var defaultOptions = optionAliases['aa'];

function getOptions(alias) {
	if (!alias)
		return defaultOptions;
	return optionAliases[alias] || defaultOptions;
}

function parse(mml, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var inputOptions = extend({}, getOptions(options.input), {
		tpqn: outputOptions.tpqn,
		minimumNoteDuration: outputOptions.tpqn,
		transpose: options.transpose || 0
	});
	var parsed = core.parseMml(mml, inputOptions);
	return parsed;
}

function generate(tokens, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var optimized = core.optimizeTokens(tokens, outputOptions);
	var generated = core.generateMml(optimized, outputOptions);
	return generated;
}

module.exports = function opt(mml, options) {
	var parsed = parse(mml, options);
	var generated = generate(parsed, options);
	return generated;
};
module.exports.getOptions = getOptions;
module.exports.parse = parse;
module.exports.generate = generate;
