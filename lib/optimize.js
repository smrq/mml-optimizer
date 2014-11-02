var aStar = require('a-star');
var extend = require('extend');
var convert = require('./convert');
var tokenText = require('./tokenText');

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
				return tokenText({
					type: 'duration',
					duration: nodeB.duration
				}, nodeA, options).length;
			if (nodeA.octave !== nodeB.octave)
				return tokenText({
					type: 'octave',
					octave: nodeB.octave
				}, nodeA, options).length;
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
	var prunedTokens = mmlTokens.filter(function (token) {
		return ['note', 'rest', 'volume', 'tempo', 'tie', 'nextVoice']
			.some(function (type) { return type === token.type });
	});
	var path = findPath(prunedTokens, options);
	var optimizedTokens = [];
	for (var i = 1; i < path.length; ++i) {
		var nodeA = path[i-1];
		var nodeB = path[i];
		if (nodeA.cursor !== nodeB.cursor)
			optimizedTokens.push(prunedTokens[nodeA.cursor]);
		else if (nodeA.duration !== nodeB.duration)
			optimizedTokens.push({
				type: 'duration',
				duration: nodeB.duration,
				time: prunedTokens[nodeB.cursor].time
			});
		else if (nodeA.octave !== nodeB.octave)
			optimizedTokens.push({
				type: 'octave',
				octave: nodeB.octave,
				time: prunedTokens[nodeB.cursor].time
			});
		else
			throw new Error('Unexpected node transition.');
	}
	return optimizedTokens;
}

module.exports = optimizeTokens;
module.exports.findPath = findPath;
