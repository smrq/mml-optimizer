var aStar = require('a-star');
var extend = require('extend');
var convert = require('./convert');

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
	return convert.midiPitchToNoteName(pitch, currentOctave) + convert.relativeDuration(ticks, currentDuration, options);
}

function restText(ticks, currentDuration, options) {
	return 'r' + convert.relativeDuration(ticks, currentDuration, options);
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
	convert.validOctaves(token.pitch).forEach(function (octave) {
		if (octave === state.octave) {
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			if (token.ticks !== convert.noteDurationToTicks(state.duration, options)) {
				convert.ticksToAllNoteDurations(token.ticks, options).forEach(function (duration) {
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
	var isSameAsCurrentDuration = token.ticks === convert.noteDurationToTicks(state.duration, options);
	if (isSameAsCurrentDuration ||
		!options.noLiteralDottedRests ||
		convert.relativeDuration(token.ticks, state.duration, options).slice(-1) !== '.') {
		neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
	}
	if (!isSameAsCurrentDuration) {
		convert.ticksToAllNoteDurations(token.ticks, options)
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
	findPath: findPath,
	optimizeTokens: optimizeTokens,
	generateMml: generateMml
};
