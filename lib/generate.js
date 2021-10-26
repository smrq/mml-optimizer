var extend = require('extend');
var tokenText = require('./tokenText');

function generate(tokens, options) {
	return tokens.reduce(function (acc, token) {
		var nextText = acc.text + tokenText(token, acc, options);
		switch (token.type) {
			case 'octave': return extend(acc, { text: nextText, octave: token.octave });
			case 'tempo': return extend(acc, { text: nextText, tempo: token.tempo });
			case 'volume': return extend(acc, { text: nextText, volume: token.volume });
			case 'duration': return extend(acc, { text: nextText, duration: token.duration });
			case 'nextVoice':
				return options.tracksShareState ?
					extend({}, acc, { text: nextText }) :
					extend({}, options.defaultState, { text: nextText });
			default:
				return extend({}, acc, { text: nextText });
		}
	}, extend({}, options.defaultState, { text: '' })).text;
}

module.exports = generate;
