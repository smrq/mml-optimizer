var aStar = require('a-star');
var extend = require('extend');

var initialOctave = 5;
var initialTempo = 100;
var initialVolume = 100;
var initialDuration = '4';
var tpqn = 500;
var minimumNoteDuration = 64;
var minimumNoteTicks = noteDurationAndDotsToTicks(minimumNoteDuration, 0);

var defaultState = {
	octave: 5,
	tempo: 100,
	volume: 100,
	duration: '4'
};

function noteDurationToTicks(duration) {
	return noteDurationAndDotsToTicks(
		parseInt(duration, 10),
		/[^.]*([.]*)/.exec(duration)[1].length);
}

function noteDurationAndDotsToTicks(duration, dots) {
	var ticks = Math.floor(tpqn * 4 / duration);
	for (var i = 0; i < dots; ++i)
		ticks = Math.floor(ticks * 1.5);
	return ticks;
}

function ticksToNoteDuration(ticks) {
	var dots = '';
	var upperBoundIncl;
	var lowerBoundExcl;

	do {
		// Bounds for the preimage of floor(1.5*floor(1.5*...floor(4*tpqn/ticks)))
		upperBoundIncl = Math.pow(1.5,dots.length)*4*tpqn / ticks;
		lowerBoundExcl = Math.pow(1.5,dots.length)*4*tpqn / (ticks + 3*Math.pow(1.5,dots.length) - 2);
		for (var n = Math.floor(upperBoundIncl); n > lowerBoundExcl; --n) {
			if (noteDurationAndDotsToTicks(n, dots.length) === ticks)
				return n + dots;
		}
		dots += '.';
	} while (lowerBoundExcl < minimumNoteDuration);

	return null;
}

function ticksToAllNoteDurations(ticks) {
	var dots = '';
	var upperBoundIncl;
	var lowerBoundExcl;
	var result = [];

	do {
		// Bounds for the preimage of floor(1.5*floor(1.5*...floor(4*tpqn/ticks)))
		upperBoundIncl = Math.pow(1.5,dots.length)*4*tpqn / ticks;
		lowerBoundExcl = Math.pow(1.5,dots.length)*4*tpqn / (ticks + 3*Math.pow(1.5,dots.length) - 2);
		for (var n = Math.floor(upperBoundIncl); n > lowerBoundExcl; --n) {
			if (noteDurationAndDotsToTicks(n, dots.length) === ticks) {
				result.push(n + dots);
				break;
			}
		}
		dots += '.';
	} while (lowerBoundExcl < minimumNoteDuration);

	return result;
}

function relativeDuration(ticks, durationRelativeTo) {
	var candidates = [];
	return ticksToAllNoteDurations(ticks)
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

function parseMml(mmlString) {
	var state = extend({}, defaultState);
	var tokens = [];

	while (mmlString.length) {
		var result;
		var tokenLength;
		if (result = /^\/\*[^]*?\*\//.exec(mmlString)) {
			tokenLength = result[0].length;
		} else if (result = /^([A-Ga-g][+#-]?)([0-9]*[.]*)/.exec(mmlString)) {
			var pitch = result[1].toLowerCase().replace(/#/g,'+');
			var duration = result[2];
			if (!duration)
				duration = state.duration;
			else if (/^[.]+$/.test(duration)) {
				duration = state.duration + duration;
			}
			tokens.push({
				type: 'note',
				pitch: pitch,
				octave: state.octave,
				ticks: noteDurationToTicks(duration),
				volume: state.volume
			});
			tokenLength = result[0].length;
		} else if (result = /^[Ll]([0-9]+[.]*)/.exec(mmlString)) {
			state.duration = result[1];
			tokenLength = result[0].length;
		} else if (result = /^[Oo]([0-9]+)/.exec(mmlString)) {
			var octave = parseInt(result[1], 10);
			state.octave = octave;
			tokens.push({ type: 'octave', octave: octave });
			tokenLength = result[0].length;
		} else if (result = /^[Vv]([0-9]+)/.exec(mmlString)) {
			var volume = parseInt(result[1], 10);
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
			tokens.push({ type: 'octaveDown' });
			tokenLength = 1;
		} else if (mmlString[0] === '>') {
			++state.octave;
			tokens.push({ type: 'octaveUp' });
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

function tokenText(token, state) {
	switch (token.type) {
		case 'note': return noteText(token.pitch, token.ticks, state.duration);
		case 'duration': return durationText(token.duration);
		case 'octave': return octaveText(token.octave);
		case 'volume': return volumeText(token.volume);
		case 'tempo': return tempoText(token.tempo);
		case 'tie': return '&';
		case 'octaveDown': return '<';
		case 'octaveUp': return '>';
		case 'nextVoice': return ',';
	}
	throw new Error('Unexpected token type.');
}

function noteText(pitch, ticks, currentDuration) {
	return pitch + relativeDuration(ticks, currentDuration);
}

function durationText(duration) {
	return 'L' + duration;
}

function octaveText(octave) {
	return 'O' + octave;
}

function volumeText(volume) {
	return 'V' + volume;
}

function tempoText(tempo) {
	return 'T' + tempo;
}

function tokenNeighbors(token, state) {
	var neighbors = [];
	switch (token.type) {
		case 'note':
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			if (token.ticks !== noteDurationToTicks(state.duration)) {
				ticksToAllNoteDurations(token.ticks)
					.forEach(function (duration) {
						neighbors.push(extend({}, state, { duration: duration }));
						while (duration[duration.length-1] === '.') {
							duration = duration.slice(0,-1);
							neighbors.push(extend({}, state, { duration: duration }));
						}
					});
			}
			break;
		case 'octave':
		case 'volume':
		case 'tempo':
		case 'tie':
		case 'octaveDown':
		case 'octaveUp':
		case 'nextVoice':
			neighbors.push(extend({}, state, { cursor: state.cursor + 1 }));
			break;
	}
	return neighbors;
}

function runPathfinder(mmlTokens) {
	var result = aStar({
		start: extend({}, defaultState, { cursor: 0 }),
		isEnd: function (node) {
			return node.cursor === mmlTokens.length;
		},
		neighbor: function (node) {
			return tokenNeighbors(mmlTokens[node.cursor], node);
		},
		distance: function (nodeA, nodeB) {
			if (nodeA.cursor !== nodeB.cursor)
				return tokenText(mmlTokens[nodeA.cursor], nodeA).length;
			if (nodeA.duration !== nodeB.duration)
				return durationText(nodeB.duration).length;
			throw new Error('Unexpected node transition.');
		},
		heuristic: function (node) {
			//var cost = mmlTokens
			//	.slice(node.cursor)
			//	.reduce(function (acc, value) {
			//		return acc + tokenText(value, node.ticks).length;
			//	}, 0);
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

function optimizeTokens(mmlTokens) {
	var path = runPathfinder(mmlTokens);
	var optimizedTokens = [];
	for (var i = 1; i < path.length; ++i) {
		if (path[i].cursor !== path[i-1].cursor)
			optimizedTokens.push(mmlTokens[path[i-1].cursor]);
		else if (path[i].duration !== path[i-1].duration)
			optimizedTokens.push({ type: 'duration', duration: path[i].duration });
		else
			throw new Error('Unexpected node transition.');
	}
	return optimizedTokens;
}

function generateMml(tokens) {
	return tokens.reduce(function (acc, token) {
		return {
			text: acc.text + tokenText(token, acc),
			duration: token.type === 'duration' ? token.duration : acc.duration
		};
	}, extend({}, defaultState, { text: '' })).text;
}

function chain(input, fns) {
	for (var i = 0; i < fns.length; ++i) {
		input = fns[i](input);
	}
	return input;
}

module.exports = function opt(input) {
	return chain(input, [
		parseMml,
		optimizeTokens,
		generateMml
	]);
};

module.exports.noteDurationToTicks = noteDurationToTicks;
module.exports.ticksToNoteDuration = ticksToNoteDuration;
module.exports.ticksToAllNoteDurations = ticksToAllNoteDurations;
module.exports.relativeDuration = relativeDuration;
module.exports.parseMml = parseMml;
module.exports.runPathfinder = runPathfinder;
module.exports.optimizeTokens = optimizeTokens;
module.exports.generateMml = generateMml;
