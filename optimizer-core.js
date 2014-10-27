var aStar = require('a-star');
var extend = require('extend');

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
	var state = extend({ time: 0 }, options.defaultState);
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
			var pitch = noteNameToMidiPitch(noteName, state.octave) + options.transpose;
			var ticks = noteDurationToTicks(duration, options);
			tokens.push({
				type: 'note',
				pitch: pitch,
				ticks: ticks,
				volume: state.volume,
				time: state.time
			});
			state.time += ticks;
			tokenLength = result[0].length;
		} else if (result = /^[Rr]([0-9]*[.]*)/.exec(mmlString)) {
			var duration = result[1];
			if (!duration)
				duration = state.duration;
			else if (/^[.]+$/.test(duration)) {
				duration = state.duration + duration;
			}
			var ticks = noteDurationToTicks(duration, options);
			tokens.push({
				type: 'rest',
				ticks: ticks,
				time: state.time
			});
			state.time += ticks;
			tokenLength = result[0].length;
		} else if (result = /^[Nn]([0-9]+)/.exec(mmlString)) {
			var pitch = parseInt(result[1], 10) + options.transpose;
			var ticks = noteDurationToTicks(state.duration, options);
			tokens.push({
				type: 'note',
				pitch: pitch,
				ticks: ticks,
				volume: state.volume,
				time: state.time
			});
			state.time += ticks;
			tokenLength = result[0].length;
		} else if (result = /^[Ll]([0-9]+[.]*)/.exec(mmlString)) {
			state.duration = result[1];
			tokenLength = result[0].length;
		} else if (result = /^[Oo]([0-9]+)/.exec(mmlString)) {
			var octave = parseInt(result[1], 10) + options.octaveOffset;
			state.octave = octave;
			tokenLength = result[0].length;
		} else if (result = /^[Vv]([0-9]+)/.exec(mmlString)) {
			var volume = [parseInt(result[1], 10), options.maxVolume];
			state.volume = volume;
			tokens.push({
				type: 'volume',
				volume: volume,
				time: state.time
			});
			tokenLength = result[0].length;
		} else if (result = /^[Tt]([0-9]+)/.exec(mmlString)) {
			var tempo = parseInt(result[1], 10);
			state.tempo = tempo;
			tokens.push({
				type: 'tempo',
				tempo: tempo,
				time: state.time
			});
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
			if (!options.tracksShareState)
				state = extend({}, options.defaultState);
			state.time = 0;
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
		case 'duration': return durationText(token.duration, state.duration);
		case 'octave': return octaveText(token.octave, state.octave, options);
		case 'volume': return volumeText(token.volume, state.volume, options);
		case 'tempo': return tempoText(token.tempo, state.tempo);
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

function durationText(duration, currentDuration) {
	if (duration === currentDuration)
		return '';
	return 'L' + duration;
}

function octaveText(octave, currentOctave, options) {
	if (currentOctave === octave)
		return '';
	if (currentOctave - octave === 1)
		return '<';
	if (currentOctave - octave === -1)
		return '>';
	return 'O' + (octave - options.octaveOffset);
}

function volumeText(volume, currentVolume, options) {
	var roundedVolume = round(volume);

	if (round(currentVolume) === roundedVolume)
		return '';

	// fudge volume values that are barely over an extra character
	// e.g. 12/15 with maxVolume = 127  -->  99/127 instead of 102/127
	var fudgedVolume = Math.pow(10, roundedVolume.toString().length-1) - 1;
	if (round([volume[0]-1, volume[1]]) < fudgedVolume)
		return 'V' + fudgedVolume;

	return 'V' + roundedVolume;

	function round(volume) {
		return Math.round(volume[0] * options.maxVolume / volume[1]);
	}
}

function tempoText(tempo, currentTempo) {
	if (currentTempo === tempo)
		return '';
	return 'T' + tempo;
}

function tokenNeighbors(token, state, options) {
	switch (token.type) {
		case 'note': return noteNeighbors(token, state, options);
		case 'rest': return restNeighbors(token, state, options);
		case 'volume':
		case 'tempo':
		case 'tie':
			return [extend({}, state, { cursor: state.cursor + 1 })];
		case 'nextVoice':
			return options.tracksShareState ?
				[extend({}, state, { cursor: state.cursor + 1 })] :
				[extend({}, options.defaultState, { cursor: state.cursor + 1 })];
	}
}

function noteNeighbors(token, state, options) {
	var neighbors = [];
	validOctaves(token.pitch).forEach(function (octave) {
		if (octave === state.octave) {
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			if (token.ticks !== noteDurationToTicks(state.duration, options)) {
				ticksToAllNoteDurations(token.ticks, options).forEach(function (duration) {
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
	return neighbors;
}

function restNeighbors(token, state, options) {
	var neighbors = [];
	var isSameAsCurrentDuration = token.ticks === noteDurationToTicks(state.duration, options);
	if (isSameAsCurrentDuration ||
		!options.noLiteralDottedRests ||
		relativeDuration(token.ticks, state.duration, options).slice(-1) !== '.') {
		neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
	}
	if (!isSameAsCurrentDuration) {
		ticksToAllNoteDurations(token.ticks, options)
			.forEach(function (duration) {
				neighbors.push(extend({}, state, { duration: duration }));
				while (duration[duration.length-1] === '.') {
					duration = duration.slice(0,-1);
					neighbors.push(extend({}, state, { duration: duration }));
				}
			});
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
				return octaveText(nodeB.octave, nodeA.octave, options).length;
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
		var nodeA = path[i-1];
		var nodeB = path[i];
		if (nodeA.cursor !== nodeB.cursor)
			optimizedTokens.push(mmlTokens[nodeA.cursor]);
		else if (nodeA.duration !== nodeB.duration)
			optimizedTokens.push({
				type: 'duration',
				duration: nodeB.duration,
				time: mmlTokens[nodeB.cursor].time
			});
		else if (nodeA.octave !== nodeB.octave)
			optimizedTokens.push({
				type: 'octave',
				octave: nodeB.octave,
				time: mmlTokens[nodeB.cursor].time
			});
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

module.exports = {
	noteDurationToTicks: noteDurationToTicks,
	ticksToAllNoteDurations: ticksToAllNoteDurations,
	relativeDuration: relativeDuration,
	noteNameToMidiPitch: noteNameToMidiPitch,
	validOctaves: validOctaves,
	midiPitchToNoteName: midiPitchToNoteName,
	parseMml: parseMml,
	findPath: findPath,
	optimizeTokens: optimizeTokens,
	generateMml: generateMml
};
