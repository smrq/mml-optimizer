var extend = require('extend');
var convert = require('./convert');

function matchComment(mmlString) {
	var regexp = /^\/\*[^]*?\*\//;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	return { consumed: result[0].length };
}

function matchNote(mmlString, state, options) {
	var regexp = /^([A-Ga-g][+#-]?)([0-9]*[.]*)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var noteName = result[1].toLowerCase().replace(/#/g,'+');
	var duration = result[2];
	if (!duration)
		duration = state.duration;
	else if (/^[.]+$/.test(duration))
		duration = state.duration + duration;
	var pitch = convert.noteNameToMidiPitch(noteName, state.octave) + options.transpose;
	var ticks = convert.noteDurationToTicks(duration, options);

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'note',
			pitch: pitch,
			ticks: ticks,
			volume: state.volume,
			time: state.time
		}],
		state: extend({}, state, { time: state.time + ticks })
	};
}

function matchRest(mmlString, state, options) {
	var regexp = /^[Rr]([0-9]*[.]*)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var duration = result[1];
	if (!duration)
		duration = state.duration;
	else if (/^[.]+$/.test(duration))
		duration = state.duration + duration;
	var ticks = convert.noteDurationToTicks(duration, options);

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'rest',
			ticks: ticks,
			time: state.time
		}],
		state: extend({}, state, { time: state.time + ticks })
	};
}

function matchPitchLiteral(mmlString, state, options) {
	var regexp = /^[Nn]([0-9]+)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var pitch = parseInt(result[1], 10) + options.transpose;
	var ticks = convert.noteDurationToTicks(state.duration, options);

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'note',
			pitch: pitch,
			ticks: ticks,
			volume: state.volume,
			time: state.time
		}],
		state: extend({}, state, { time: state.time + ticks })
	};
}

function matchDuration(mmlString, state) {
	var regexp = /^[Ll]([0-9]+[.]*)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var duration = result[1];

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'duration',
			duration: duration,
			time: state.time
		}],
		state: extend({}, state, { duration: duration })
	};
}

function matchOctave(mmlString, state, options) {
	var regexp = /^[Oo]([0-9]+)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var octave = parseInt(result[1], 10);

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'octave',
			octave: octave,
			time: state.time
		}],
		state: extend({}, state, { octave: octave })
	};
}

function matchVolume(mmlString, state, options) {
	var regexp = /^[Vv]([0-9]+)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var volume = [parseInt(result[1], 10), options.maxVolume];

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'volume',
			volume: volume,
			time: state.time
		}],
		state: extend({}, state, { volume: volume })
	};
}

function matchTempo(mmlString, state) {
	var regexp = /^[Tt]([0-9]+)/;
	var result;
	if (!(result = regexp.exec(mmlString)))
		return;

	var tempo = parseInt(result[1], 10);

	return {
		consumed: result[0].length,
		tokens: [{
			type: 'tempo',
			tempo: tempo,
			time: state.time
		}],
		state: extend({}, state, { tempo: tempo })
	};
}

function matchTie(mmlString) {
	if (mmlString[0] !== '&')
		return;

	return {
		consumed: 1,
		tokens: [{ type: 'tie' }]
	};
}

function matchOctaveDown(mmlString, state) {
	if (mmlString[0] !== '<')
		return;

	var octave = state.octave - 1;

	return {
		consumed: 1,
		tokens: [{
			type: 'octave',
			octave: octave,
			time: state.time
		}],
		state: extend({}, state, { octave: octave })
	};
}

function matchOctaveUp(mmlString, state) {
	if (mmlString[0] !== '>')
		return;

	var octave = state.octave + 1;

	return {
		consumed: 1,
		tokens: [{
			type: 'octave',
			octave: octave,
			time: state.time
		}],
		state: extend({}, state, { octave: octave })
	};
}

function matchNextVoice(mmlString, state, options) {
	if (mmlString[0] !== ',')
		return;

	return {
		consumed: 1,
		tokens: [{ type: 'nextVoice' }],
		state: extend({},
			options.tracksShareState ? state : options.defaultState,
			{ time: 0 })
	};
}

var matchers = [
	matchComment, matchNote, matchRest, matchPitchLiteral,
	matchDuration, matchOctave, matchVolume, matchTempo,
	matchTie, matchOctaveDown, matchOctaveUp, matchNextVoice
];

function parseMml(mmlString, options) {
	var state = extend({ time: 0 }, options.defaultState);
	var tokens = [];

	while (mmlString.length) {
		for (var i = 0; i < matchers.length; ++i) {
			var result = matchers[i](mmlString, state, options);
			if (result) {
				mmlString = mmlString.slice(result.consumed);
				tokens = tokens.concat(result.tokens || []);
				state = result.state || state;
				break;
			}
		}
		if (i === matchers.length)
			mmlString = mmlString.slice(1);
	}

	return tokens;
}

module.exports = parseMml;
