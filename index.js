var aStar = require('a-star');

var initialOctave = 4;
var initialTempo = 120;
var initialVolume = 100;
var initialDuration = '4';
var tpqn = 96;

function noteDurationToTicks(noteDuration) {
	var dotted = noteDuration.indexOf('.') !== -1;
	var noteFraction = parseInt(noteDuration, 10);
	var ticks = Math.floor((tpqn * 4) / noteFraction);
	if (dotted)
		ticks = Math.floor(ticks * 1.5);
	return ticks;
}

var ticksToNoteDuration = (function () {
	var memo = {};
	for (var i = 64; i > 0; --i) {
		var iStr = String(i);
		var iStrDotted = iStr + '.';

		var dotted = noteDurationToTicks(iStrDotted);
		var regular = noteDurationToTicks(iStr);

		if (!memo[dotted])
			memo[dotted] = iStrDotted;

		if (!memo[regular] || memo[regular].length > iStr.length)
			memo[regular] = iStr;
	}
	return function (ticks) { return memo[ticks]; };
})();

function parseMml(mmlString) {
	var octave = initialOctave;
	var duration = initialDuration;
	var tempo = initialTempo;
	var volume = initialVolume;
	var tokens = [];

	while (mmlString.length) {
		var result;
		if (result = /^\/\*[^]*?\*\//.exec(mmlString)) {
			mmlString = mmlString.slice(result[0].length);
		} else if (result = /^([A-Ga-g][+#-]?)([0-9]*[.]?)/.exec(mmlString)) {
			var noteDuration = result[2];
			if (!noteDuration)
				noteDuration = duration;
			else if (noteDuration === '.') {
				noteDuration = duration;
				if (noteDuration.indexOf('.') !== -1) {
					noteDuration += '.';
				}
			}
			tokens.push({
				type: 'note',
				pitch: result[1].toLowerCase().replace(/#/g,'+'),
				octave: octave,
				ticks: noteDurationToTicks(noteDuration),
				volume: volume
			});
			mmlString = mmlString.slice(result[0].length);
		} else if (result = /^[Ll]([0-9]+[.]?)/.exec(mmlString)) {
			duration = result[1];
			mmlString = mmlString.slice(result[0].length);
		} else if (result = /^[Oo]([0-9]+)/.exec(mmlString)) {
			octave = result[1];
			tokens.push({
				type: 'octave',
				octave: parseInt(result[1], 10)
			});
			mmlString = mmlString.slice(result[0].length);
		} else if (result = /^[Vv]([0-9]+)/.exec(mmlString)) {
			volume = result[1];
			tokens.push({
				type: 'volume',
				volume: parseInt(result[1], 10)
			});
			mmlString = mmlString.slice(result[0].length);
		} else if (result = /^[Tt]([0-9]+)/.exec(mmlString)) {
			tempo = result[1];
			tokens.push({
				type: 'tempo',
				tempo: parseInt(result[1], 10)
			});
			mmlString = mmlString.slice(result[0].length);
		} else if (mmlString[0] === '&') {
			tokens.push({ type: 'tie' });
			mmlString = mmlString.slice(1);
		} else if (mmlString[0] === '<') {
			--octave;
			tokens.push({ type: 'octaveDown' });
			mmlString = mmlString.slice(1);
		} else if (mmlString[0] === '>') {
			++octave;
			tokens.push({ type: 'octaveUp' });
			mmlString = mmlString.slice(1);
		} else if (mmlString[0] === ',') {
			tokens.push({ type: 'nextVoice' });
			mmlString = mmlString.slice(1);
		} else {
			mmlString = mmlString.slice(1);
		}
	}

	return tokens;
}

function tokenText(token, currentTicks) {
	switch (token.type) {
		case 'note': return noteText(token.pitch, token.ticks, currentTicks);
		case 'duration': return durationText(token.ticks);
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

function noteText(pitch, ticks, currentTicks) {
	var text = pitch;
	if (ticks !== currentTicks)
		text += ticksToNoteDuration(ticks);
	return text;
}

function durationText(ticks) {
	return 'L' + ticksToNoteDuration(ticks);
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

function optimizeDurationChanges(mmlTokens) {
	var result = aStar({
		start: { ticks: tpqn, cursor: 0 },
		isEnd: function (node) {
			return node.cursor === mmlTokens.length;
		},
		neighbor: function (node) {
			var token = mmlTokens[node.cursor];
			var neighbors = [{
				ticks: node.ticks,
				cursor: node.cursor + 1
			}];
			if (token.type === 'note' && token.ticks !== node.ticks) {
				neighbors.push({
					ticks: token.ticks,
					cursor: node.cursor
				});
			}
			return neighbors;
		},
		distance: function (nodeA, nodeB) {
			if (nodeA.cursor !== nodeB.cursor)
				return tokenText(mmlTokens[nodeA.cursor], nodeA.ticks).length;
			if (nodeA.ticks !== nodeB.ticks)
				return durationText(nodeB.ticks).length;
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
			return node.ticks + '|' + node.cursor;
		}
	});

	var optimizedTokens = [];
	for (var i = 1; i < result.path.length; ++i) {
		if (result.path[i].cursor !== result.path[i-1].cursor)
			optimizedTokens.push(mmlTokens[result.path[i-1].cursor]);
		else if (result.path[i].ticks !== result.path[i-1].ticks)
			optimizedTokens.push({ type: 'duration', ticks: result.path[i].ticks });
	}
	return optimizedTokens;
}

function generateMml(tokens) {
	return tokens.reduce(function (acc, token) {
		return {
			text: acc.text + tokenText(token, acc.ticks),
			ticks: token.type === 'duration' ? token.ticks : acc.ticks
		};
	}, { text: '', ticks: tpqn }).text;
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
		optimizeDurationChanges,
		generateMml
	]);
};

module.exports.noteDurationToTicks = noteDurationToTicks;
module.exports.ticksToNoteDuration = ticksToNoteDuration;
module.exports.parseMml = parseMml;
module.exports.optimizeDurationChanges = optimizeDurationChanges;
module.exports.generateMml = generateMml;