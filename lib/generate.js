var extend = require('extend');
var tokenText = require('./tokenText');

function generate(tokens, options) {
	return tokens.reduce(function (acc, token) {
		return extend(acc, {
			text: acc.text + tokenText(token, acc, options),
			octave: token.type === 'octave' ? token.octave : acc.octave,
			tempo: token.type === 'tempo' ? token.tempo : acc.tempo,
			volume: token.type === 'volume' ? token.volume : acc.volume,
			duration: token.type === 'duration' ? token.duration : acc.duration
		});
	}, extend({}, options.defaultState, { text: '' })).text;
}

module.exports = generate;
