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

function roundVolume(volume, options) {
	var roundedVolume = round(volume);

	// fudge volume values that are barely over an extra character
	// e.g. 12/15 with maxVolume = 127  -->  99/127 instead of 102/127
	var fudgedVolume = Math.pow(10, roundedVolume.toString().length-1) - 1;
	if (round([volume[0]-1, volume[1]]) < fudgedVolume)
		return fudgedVolume;

	return roundedVolume;

	function round(volume) {
		return Math.round(volume[0] * options.maxVolume / volume[1]);
	}
}

module.exports = {
	noteDurationToTicks: noteDurationToTicks,
	ticksToAllNoteDurations: ticksToAllNoteDurations,
	relativeDuration: relativeDuration,
	noteNameToMidiPitch: noteNameToMidiPitch,
	validOctaves: validOctaves,
	midiPitchToNoteName: midiPitchToNoteName,
	roundVolume: roundVolume
};
