module.exports = {
	mabi: {
		tpqn: 96,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: [8,15],
			duration: '4'
		},
		maxVolume: 15,
		supportsNoteNumbers: true,
		tracksShareState: false,
	},
	aa: {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 5,
			tempo: 120,
			volume: [100,127],
			duration: '4'
		},
		maxVolume: 127,
		supportsNoteNumbers: false,
		tracksShareState: true,
	}
};
