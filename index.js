var aStar = require('a-star');
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
		tracksShareState: false
	},
	'aa': {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 5,
			tempo: 100,
			volume: 100/127,
			duration: '4'
		},
		maxVolume: 127,
		supportsNoteNumbers: false,
		tracksShareState: true
	}
}
var defaultOptions = optionAliases['aa'];

function noteDurationToTicks(duration, options) {
	return noteDurationAndDotsToTicks(
		parseInt(duration, 10),
		/[^.]*([.]*)/.exec(duration)[1].length,
		options);
}

function noteDurationAndDotsToTicks(duration, dots, options) {
	var ticks = Math.floor(options.tpqn * 4 / duration);
	for (var i = 0; i < dots; ++i)
		ticks = Math.floor(ticks * 1.5);
	return ticks;
}

function ticksToAllNoteDurations(ticks, options) {
	var dots = '';
	var upperBoundIncl;
	var lowerBoundExcl;
	var result = [];

	while (true) {
		// Bounds for the preimage of floor(1.5*floor(1.5*...floor(4*tpqn/ticks)))
		upperBoundIncl = Math.pow(1.5,dots.length)*4*options.tpqn / ticks;
		lowerBoundExcl = Math.pow(1.5,dots.length)*4*options.tpqn / (ticks + 3*Math.pow(1.5,dots.length) - 2);
		if (lowerBoundExcl >= options.minimumNoteDuration)
			break;
		for (var n = Math.floor(upperBoundIncl); n > lowerBoundExcl; --n) {
			if (noteDurationAndDotsToTicks(n, dots.length, options) === ticks) {
				result.push(n + dots);
				break;
			}
		}
		dots += '.';
	}

	return result;
}

function relativeDuration(ticks, durationRelativeTo, options) {
	var candidates = [];
	return ticksToAllNoteDurations(ticks, options)
		.map(function (duration) {
			if (duration === durationRelativeTo)
				return '';
			else if (parseInt(duration, 10) === parseInt(durationRelativeTo, 10) &&
				duration.length > durationRelativeTo.length)
				return duration.slice(durationRelativeTo.length);
			return duration;
		})
		.reduce(function (shortestDuration, duration) {
			if (shortestDuration.length > duration.length)
				return duration;
			return shortestDuration;
		});
}

function noteNameToMidiPitch(note, octave) {
	var midiMap = {
		'c': 0,
		'd': 2,
		'e': 4,
		'f': 5,
		'g': 7,
		'a': 9,
		'b': 11
	};
	var accidentalMap = {
		'+': 1,
		'-': -1,
		'': 0
	};
	return 12*octave + midiMap[note[0]] + accidentalMap[note[1] || ''];
}

function validOctaves(pitch) {
	var octave = Math.floor(pitch / 12);
	if (pitch % 12 === 0 && octave > 0)
		return [octave - 1, octave];
	if (pitch % 12 === 11)
		return [octave, octave + 1];
	return [octave];
}

function midiPitchToNoteName(pitch, octave) {
	var noteNameMap = {
		'-1': 'c-',
		'0': 'c',
		'1': 'c+',
		'2': 'd',
		'3': 'd+',
		'4': 'e',
		'5': 'f',
		'6': 'f+',
		'7': 'g',
		'8': 'g+',
		'9': 'a',
		'10': 'a+',
		'11': 'b',
		'12': 'b+'
	};
	return noteNameMap[pitch - (octave * 12)];
}

function parseMml(mmlString, options) {
	var state = extend({}, options.defaultState);
	var tokens = [];

	while (mmlString.length) {
		var result;
		var tokenLength;
		if (result = /^\/\*[^]*?\*\//.exec(mmlString)) {
			tokenLength = result[0].length;
		} else if (result = /^([A-Ga-g][+#-]?)([0-9]*[.]*)/.exec(mmlString)) {
			var noteName = result[1].toLowerCase().replace(/#/g,'+');
			var duration = result[2];
			if (!duration)
				duration = state.duration;
			else if (/^[.]+$/.test(duration)) {
				duration = state.duration + duration;
			}
			tokens.push({
				type: 'note',
				pitch: noteNameToMidiPitch(noteName, state.octave),
				ticks: noteDurationToTicks(duration, options),
				volume: state.volume
			});
			tokenLength = result[0].length;
		} else if (result = /^[Rr]([0-9]*[.]*)/.exec(mmlString)) {
			var duration = result[1];
			if (!duration)
				duration = state.duration;
			else if (/^[.]+$/.test(duration)) {
				duration = state.duration + duration;
			}
			tokens.push({
				type: 'rest',
				ticks: noteDurationToTicks(duration, options)
			});
			tokenLength = result[0].length;
		} else if (result = /^[Nn]([0-9]+)/.exec(mmlString)) {
			var pitch = parseInt(result[1], 10);
			tokens.push({
				type: 'note',
				pitch: pitch,
				ticks: noteDurationToTicks(state.duration, options),
				volume: state.volume
			});
			tokenLength = result[0].length;
		} else if (result = /^[Ll]([0-9]+[.]*)/.exec(mmlString)) {
			state.duration = result[1];
			tokenLength = result[0].length;
		} else if (result = /^[Oo]([0-9]+)/.exec(mmlString)) {
			var octave = parseInt(result[1], 10);
			state.octave = octave;
			tokenLength = result[0].length;
		} else if (result = /^[Vv]([0-9]+)/.exec(mmlString)) {
			var volume = parseInt(result[1], 10) / options.maxVolume;
			state.volume = volume;
			tokens.push({ type: 'volume', volume: volume });
			tokenLength = result[0].length;
		} else if (result = /^[Tt]([0-9]+)/.exec(mmlString)) {
			var tempo = parseInt(result[1], 10);
			state.tempo = tempo;
			tokens.push({ type: 'tempo', tempo: tempo });
			tokenLength = result[0].length;
		} else if (mmlString[0] === '&') {
			tokens.push({ type: 'tie' });
			tokenLength = 1;
		} else if (mmlString[0] === '<') {
			--state.octave;
			tokenLength = 1;
		} else if (mmlString[0] === '>') {
			++state.octave;
			tokenLength = 1;
		} else if (mmlString[0] === ',') {
			tokens.push({ type: 'nextVoice' });
			tokenLength = 1;
		} else {
			tokenLength = 1;
		}

		mmlString = mmlString.slice(tokenLength);
	}

	return tokens;
}

function tokenText(token, state, options) {
	switch (token.type) {
		case 'note': return noteText(token.pitch, token.ticks, state.octave, state.duration, options);
		case 'rest': return restText(token.ticks, state.duration, options);
		case 'duration': return durationText(token.duration);
		case 'octave': return octaveText(token.octave, state.octave);
		case 'volume': return volumeText(token.volume, options);
		case 'tempo': return tempoText(token.tempo);
		case 'tie': return '&';
		case 'nextVoice': return ',';
	}
	throw new Error('Unexpected token type.');
}

function noteText(pitch, ticks, currentOctave, currentDuration, options) {
	return midiPitchToNoteName(pitch, currentOctave) + relativeDuration(ticks, currentDuration, options);
}

function restText(ticks, currentDuration, options) {
	return 'r' + relativeDuration(ticks, currentDuration, options);
}

function durationText(duration) {
	return 'L' + duration;
}

function octaveText(octave, currentOctave) {
	if (currentOctave - octave === 1)
		return '<';
	if (currentOctave - octave === -1)
		return '>';
	return 'O' + octave;
}

function volumeText(volume, options) {
	return 'V' + Math.round(volume * options.maxVolume);
}

function tempoText(tempo) {
	return 'T' + tempo;
}

function tokenNeighbors(token, state, options) {
	var neighbors = [];
	switch (token.type) {
		case 'note':
			validOctaves(token.pitch).forEach(function (octave) {
				if (octave === state.octave) {
					neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
					if (token.ticks !== noteDurationToTicks(state.duration, options)) {
						ticksToAllNoteDurations(token.ticks, options)
							.forEach(function (duration) {
								neighbors.push(extend({}, state, { duration: duration }));
								while (duration[duration.length-1] === '.') {
									duration = duration.slice(0,-1);
									neighbors.push(extend({}, state, { duration: duration }));
								}
							});
					}
				} else {
					neighbors.push(extend({}, state, { octave: octave }));
				}
			});
			break;
		case 'rest':
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			if (token.ticks !== noteDurationToTicks(state.duration, options)) {
				ticksToAllNoteDurations(token.ticks, options)
					.forEach(function (duration) {
						neighbors.push(extend({}, state, { duration: duration }));
						while (duration[duration.length-1] === '.') {
							duration = duration.slice(0,-1);
							neighbors.push(extend({}, state, { duration: duration }));
						}
					});
			}
		case 'volume':
		case 'tempo':
		case 'tie':
		case 'nextVoice':
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			break;
	}
	return neighbors;
}

function findPath(mmlTokens, options) {
	var result = aStar({
		start: extend({}, options.defaultState, { cursor: 0 }),
		isEnd: function (node) {
			return node.cursor === mmlTokens.length;
		},
		neighbor: function (node) {
			return tokenNeighbors(mmlTokens[node.cursor], node, options);
		},
		distance: function (nodeA, nodeB) {
			if (nodeA.cursor !== nodeB.cursor)
				return tokenText(mmlTokens[nodeA.cursor], nodeA, options).length;
			if (nodeA.duration !== nodeB.duration)
				return durationText(nodeB.duration).length;
			if (nodeA.octave !== nodeB.octave)
				return octaveText(nodeB.octave, nodeA.octave).length;
			throw new Error('Unexpected node transition.');
		},
		heuristic: function (node) {
			return mmlTokens.length - node.cursor;
		},
		hash: function (node) {
			return JSON.stringify(node);
		}
	});
	if (result.status === 'noPath')
		throw new Error('No optimized path found.');
	return result.path;
}

function optimizeTokens(mmlTokens, options) {
	var path = findPath(mmlTokens, options);
	var optimizedTokens = [];
	for (var i = 1; i < path.length; ++i) {
		if (path[i].cursor !== path[i-1].cursor)
			optimizedTokens.push(mmlTokens[path[i-1].cursor]);
		else if (path[i].duration !== path[i-1].duration)
			optimizedTokens.push({ type: 'duration', duration: path[i].duration });
		else if (path[i].octave !== path[i-1].octave)
			optimizedTokens.push({ type: 'octave', octave: path[i].octave });
		else
			throw new Error('Unexpected node transition.');
	}
	return optimizedTokens;
}

function generateMml(tokens, options) {
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

function getOptions(alias) {
	if (!alias)
		return defaultOptions;
	return optionAliases[alias] || defaultOptions;
}

module.exports = function opt(input, options) {
	options = options || {};
	var outputOptions = getOptions(options.output);
	var inputOptions = extend(getOptions(options.input), {
		tpqn: outputOptions.tpqn,
		minimumNoteDuration: outputOptions.tpqn
	});
	var parsed = parseMml(input, inputOptions);
	var optimized = optimizeTokens(parsed, outputOptions);
	var generated = generateMml(optimized, outputOptions);

	return generated;
};

module.exports.noteDurationToTicks = noteDurationToTicks;
module.exports.ticksToAllNoteDurations = ticksToAllNoteDurations;
module.exports.relativeDuration = relativeDuration;
module.exports.noteNameToMidiPitch = noteNameToMidiPitch;
module.exports.validOctaves = validOctaves;
module.exports.midiPitchToNoteName = midiPitchToNoteName;
module.exports.parseMml = parseMml;
module.exports.findPath = findPath;
module.exports.optimizeTokens = optimizeTokens;
module.exports.generateMml = generateMml;
