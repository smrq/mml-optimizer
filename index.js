var core = require('./optimizer-core');
var extend = require('extend');

var optionAliases = {
	'mabi': {
		tpqn: 96,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: 8/15,
			duration: '4'
		},
		maxVolume: 15,
		supportsNoteNumbers: true,
		tracksShareState: false,
		octaveOffset: 0
	},
	'aa': {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: 100/127,
			duration: '4'
		},
		maxVolume: 127,
		supportsNoteNumbers: false,
		tracksShareState: true,
		octaveOffset: -1
	}
}
var defaultOptions = optionAliases['aa'];

function getOptions(alias) {
	if (!alias)
		return defaultOptions;
	return optionAliases[alias] || defaultOptions;
}

module.exports = function opt(input, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var inputOptions = extend({}, getOptions(options.input), {
		tpqn: outputOptions.tpqn,
		minimumNoteDuration: outputOptions.tpqn,
		transpose: options.transpose || 0
	});
	var parsed = core.parseMml(input, inputOptions);
	var optimized = core.optimizeTokens(parsed, outputOptions);
	var generated = core.generateMml(optimized, outputOptions);

	return generated;
};
