var convert = require('./convert');

function tokenText(token, state, options) {
	switch (token.type) {
		case 'note': return noteText(token.pitch, token.ticks, state.octave, state.duration, options);
		case 'rest': return restText(token.ticks, state.duration, options);
		case 'duration': return durationText(token.duration, state.duration);
		case 'octave': return octaveText(token.octave, state.octave, options);
		case 'volume': return volumeText(token.volume, options);
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
	return 'l' + duration;
}

function octaveText(octave, currentOctave, options) {
	if (currentOctave === octave)
		return '';
	if (currentOctave - octave === 1)
		return '<';
	if (currentOctave - octave === -1)
		return '>';
	return 'o' + (octave - options.octaveOffset);
}

function volumeText(volume, options) {
	return 'v' + convert.roundVolume(volume, options);
}

function tempoText(tempo, currentTempo) {
	if (currentTempo === tempo)
		return '';
	return 't' + tempo;
}

module.exports = tokenText;
