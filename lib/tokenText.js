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

module.exports = tokenText;
