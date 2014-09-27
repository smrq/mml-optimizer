var opt = require('./index.js');
var assert = require('chai').assert;
var extend = require('extend');
var fmt = require('simple-fmt');

function runCases(text, fn, cases) {
	cases.forEach(function (testCase) {
		var input = testCase[0], output = testCase[1];
		if (!Array.isArray(input))
			input = [input];
		it(fmt(text, input, output), function () {
			assert.deepEqual(fn.apply(null, input), output);
		});
	});
}

describe('noteDurationToTicks', function () {
	var options = { tpqn: 500 };
	runCases('should convert {0} to {1}', opt.noteDurationToTicks, [
		[['1', options], 2000],
		[['1.', options], 3000],
		[['1..', options], 4500],
		[['1...', options], 6750],
		[['3', options], 666],
		[['3.', options], 999],
		[['4', options], 500],
		[['4.', options], 750],
		[['5', options], 400],
		[['5.', options], 600],
		[['7', options], 285],
		[['7.', options], 427],
		[['64', options], 31],
		[['64.', options], 46]
	]);
});

describe('ticksToAllNoteDurations', function () {
	var options = { tpqn: 500, minimumNoteDuration: 64 };
	runCases('should convert {0} to {1}', opt.ticksToAllNoteDurations, [
		[[31, options], ['64']],
		[[46, options], ['43', '64.']],
		[[61, options], ['48.']],
		[[111, options], ['18', '27.']],
		[[166, options], ['12', '18.', '27..']],
		[[285, options], ['7', '35....', '52.....']],
		[[333, options], ['6', '9.', '30....', '45.....']],
		[[400, options], ['5']],
		[[427, options], ['7.', '35.....', '52......']],
		[[500, options], ['4']],
		[[600, options], ['5.']],
		[[666, options], ['3']],
		[[750, options], ['4.']],
		[[999, options], ['3.']],
		[[2000, options], ['1']],
		[[3000, options], ['1.']],
		[[4500, options], ['1..']],
		[[6750, options], ['1...']]
	]);

	it('should convert ticks to duration and back', function () {
		for (var i = 1; i <= 64; ++i) {
			for (var dots = ''; dots.length < 3; dots += '.') {
				var ticks = opt.noteDurationToTicks(i + dots, options);
				var durations = opt.ticksToAllNoteDurations(ticks, options);
				durations.forEach(function (duration) {
					assert.equal(opt.noteDurationToTicks(duration, options),
						ticks,
						'Testing ' + i + dots);
				});
			}
		}
	});
});

describe('relativeDuration', function () {
	var options = { tpqn: 500, minimumNoteDuration: 64 };
	runCases('should convert {0} to {1}', opt.relativeDuration, [
		[[opt.noteDurationToTicks('4', options), '1', options], '4'],
		[[opt.noteDurationToTicks('4', options), '4', options], ''],
		[[opt.noteDurationToTicks('4', options), '4.', options], '4'],
		[[opt.noteDurationToTicks('4.', options), '4', options], '.'],
		[[opt.noteDurationToTicks('4..', options), '4.', options], '.'],
		[[opt.noteDurationToTicks('4...', options), '4.', options], '..'],
		[[opt.noteDurationToTicks('4....', options), '4.', options], '...'],
		[[opt.noteDurationToTicks('12', options), '12', options], ''],
		[[opt.noteDurationToTicks('12', options), '18', options], '.'],
		[[opt.noteDurationToTicks('12', options), '27', options], '12']
	]);
});

describe('noteNameToMidiPitch', function () {
	runCases('should convert {0} to {1}', opt.noteNameToMidiPitch, [
		[['c', 5], 60],
		[['c+', 5], 61],
		[['c-', 5], 59],
		[['c', 4], 48],
		[['a', 5], 69]
	]);
});

describe('validOctaves', function () {
	runCases('should convert {0} to {1}', opt.validOctaves, [
		[opt.noteNameToMidiPitch('g', 4), [4]],
		[opt.noteNameToMidiPitch('c', 4), [3, 4]],
		[opt.noteNameToMidiPitch('b', 4), [4, 5]],
		[opt.noteNameToMidiPitch('c', 0), [0]]
	]);
});

describe('midiPitchToNoteName', function () {
	runCases('should convert {0} to {1}', opt.midiPitchToNoteName, [
		[[67, 5], 'g'],
		[[68, 5], 'g+'],
		[[60, 5], 'c'],
		[[59, 5], 'c-'],
		[[59, 4], 'b'],
		[[60, 4], 'b+']
	]);
});

describe('parseMml', function () {
	var options = {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 100,
			volume: 100/127,
			duration: '4'
		},
		maxVolume: 127,
		tracksShareState: true,
		octaveOffset: -1
	};
	runCases('should parse {0}', opt.parseMml, [
		[['ccc', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 }
		]],
		[['cdefgabCDEFGAB', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 50, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 52, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 53, ticks: 500, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 55, ticks: 500, volume: 100/127, time: 2000 },
			{ type: 'note', pitch: 57, ticks: 500, volume: 100/127, time: 2500 },
			{ type: 'note', pitch: 59, ticks: 500, volume: 100/127, time: 3000 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 3500 },
			{ type: 'note', pitch: 50, ticks: 500, volume: 100/127, time: 4000 },
			{ type: 'note', pitch: 52, ticks: 500, volume: 100/127, time: 4500 },
			{ type: 'note', pitch: 53, ticks: 500, volume: 100/127, time: 5000 },
			{ type: 'note', pitch: 55, ticks: 500, volume: 100/127, time: 5500 },
			{ type: 'note', pitch: 57, ticks: 500, volume: 100/127, time: 6000 },
			{ type: 'note', pitch: 59, ticks: 500, volume: 100/127, time: 6500 },
		]],
		[['c#d#e#f#g#a#b#c+d+e+f+g+a+b+c-d-e-f-g-a-b-', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 51, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 53, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 54, ticks: 500, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 56, ticks: 500, volume: 100/127, time: 2000 },
			{ type: 'note', pitch: 58, ticks: 500, volume: 100/127, time: 2500 },
			{ type: 'note', pitch: 60, ticks: 500, volume: 100/127, time: 3000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: 100/127, time: 3500 },
			{ type: 'note', pitch: 51, ticks: 500, volume: 100/127, time: 4000 },
			{ type: 'note', pitch: 53, ticks: 500, volume: 100/127, time: 4500 },
			{ type: 'note', pitch: 54, ticks: 500, volume: 100/127, time: 5000 },
			{ type: 'note', pitch: 56, ticks: 500, volume: 100/127, time: 5500 },
			{ type: 'note', pitch: 58, ticks: 500, volume: 100/127, time: 6000 },
			{ type: 'note', pitch: 60, ticks: 500, volume: 100/127, time: 6500 },
			{ type: 'note', pitch: 47, ticks: 500, volume: 100/127, time: 7000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: 100/127, time: 7500 },
			{ type: 'note', pitch: 51, ticks: 500, volume: 100/127, time: 8000 },
			{ type: 'note', pitch: 52, ticks: 500, volume: 100/127, time: 8500 },
			{ type: 'note', pitch: 54, ticks: 500, volume: 100/127, time: 9000 },
			{ type: 'note', pitch: 56, ticks: 500, volume: 100/127, time: 9500 },
			{ type: 'note', pitch: 58, ticks: 500, volume: 100/127, time: 10000 }
		]],
		[['c2c4c8c', options], [
			{ type: 'note', pitch: 48, ticks: 1000, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 250, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1750 }
		]],
		[['c2c2.c2..c2...', options], [
			{ type: 'note', pitch: 48, ticks: 1000, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 1500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 2250, volume: 100/127, time: 2500 },
			{ type: 'note', pitch: 48, ticks: 3375, volume: 100/127, time: 4750 }
		]],
		[['cc.c..c...', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 750, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 1125, volume: 100/127, time: 1250 },
			{ type: 'note', pitch: 48, ticks: 1687, volume: 100/127, time: 2375 }
		]],
		[['n60n30n90', options], [
			{ type: 'note', pitch: 60, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 30, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 90, ticks: 500, volume: 100/127, time: 1000 }
		]],
		[['r2r4r8r', options], [
			{ type: 'rest', ticks: 1000, time: 0 },
			{ type: 'rest', ticks: 500, time: 1000 },
			{ type: 'rest', ticks: 250, time: 1500 },
			{ type: 'rest', ticks: 500, time: 1750 }
		]],
		[['r2r2.r2..r2...', options], [
			{ type: 'rest', ticks: 1000, time: 0 },
			{ type: 'rest', ticks: 1500, time: 1000 },
			{ type: 'rest', ticks: 2250, time: 2500 },
			{ type: 'rest', ticks: 3375, time: 4750 }
		]],
		[['rr.r..r...', options], [
			{ type: 'rest', ticks: 500, time: 0 },
			{ type: 'rest', ticks: 750, time: 500 },
			{ type: 'rest', ticks: 1125, time: 1250 },
			{ type: 'rest', ticks: 1687, time: 2375 }
		]],
		[['ccc /* this is a comment v64 */ ccc', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 2000 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 2500 }
		]],
		[['ccc /* this is a\nmulti line\r\ncomment v64 */ ccc', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 2000 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 2500 }
		]],
		[['ccL8cc', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 250, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 250, volume: 100/127, time: 1250 }
		]],
		[['rrL8rr', options], [
			{ type: 'rest', ticks: 500, time: 0 },
			{ type: 'rest', ticks: 500, time: 500 },
			{ type: 'rest', ticks: 250, time: 1000 },
			{ type: 'rest', ticks: 250, time: 1250 }
		]],
		[['L2cc.c..c...', options], [
			{ type: 'note', pitch: 48, ticks: 1000, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 1500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 48, ticks: 2250, volume: 100/127, time: 2500 },
			{ type: 'note', pitch: 48, ticks: 3375, volume: 100/127, time: 4750 }
		]],
		[['L4.cc.c..c...', options], [
			{ type: 'note', pitch: 48, ticks: 750, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 1125, volume: 100/127, time: 750 },
			{ type: 'note', pitch: 48, ticks: 1687, volume: 100/127, time: 1875 },
			{ type: 'note', pitch: 48, ticks: 2530, volume: 100/127, time: 3562 }
		]],
		[['o3c>c>c<c<c', options], [
			{ type: 'note', pitch: 24, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 36, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 },
			{ type: 'note', pitch: 36, ticks: 500, volume: 100/127, time: 1500 },
			{ type: 'note', pitch: 24, ticks: 500, volume: 100/127, time: 2000 }
		]],
		[['t180ccc', options], [
			{ type: 'tempo', tempo: 180 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 }
		]],
		[['v64ccc', options], [
			{ type: 'volume', volume: 64/127 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 64/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 64/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 64/127, time: 1000 }
		]],
		[['c&c&c', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'tie' },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'tie' },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 }
		]],
		[['L8V64O2c,c,c', options], [
			{ type: 'volume', volume: 64/127 },
			{ type: 'note', pitch: 12, ticks: 250, volume: 64/127, time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 12, ticks: 250, volume: 64/127, time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 12, ticks: 250, volume: 64/127, time: 0 }
		]],
		[['L8V64O2c,c,c', extend({}, options, { tracksShareState: false })], [
			{ type: 'volume', volume: 64/127 },
			{ type: 'note', pitch: 12, ticks: 250, volume: 64/127, time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 }
		]],
		[['@#$ ccc !|/', options], [
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 0 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: 100/127, time: 1000 }
		]]
	]);
});

describe('findPath', function () {
	var options = {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 120,
			volume: 100/127,
			duration: '4'
		}
	};
	runCases('should find a path given an input token set', opt.findPath, [
		[[opt.parseMml('cdef', options), options], [
			{ cursor: 0, octave: 4, tempo: 120, volume: 100/127, duration: '4' },
			{ cursor: 1, octave: 4, tempo: 120, volume: 100/127, duration: '4' },
			{ cursor: 2, octave: 4, tempo: 120, volume: 100/127, duration: '4' },
			{ cursor: 3, octave: 4, tempo: 120, volume: 100/127, duration: '4' },
			{ cursor: 4, octave: 4, tempo: 120, volume: 100/127, duration: '4' }
		]],
		[[opt.parseMml('c16d16e32f32', options), options], [
			{ cursor: 0, octave: 4, tempo: 120, volume: 100/127, duration: '4' },
			{ cursor: 0, octave: 4, tempo: 120, volume: 100/127, duration: '16' },
			{ cursor: 1, octave: 4, tempo: 120, volume: 100/127, duration: '16' },
			{ cursor: 2, octave: 4, tempo: 120, volume: 100/127, duration: '16' },
			{ cursor: 2, octave: 4, tempo: 120, volume: 100/127, duration: '32' },
			{ cursor: 3, octave: 4, tempo: 120, volume: 100/127, duration: '32' },
			{ cursor: 4, octave: 4, tempo: 120, volume: 100/127, duration: '32' }
		]]
	]);
});

describe('mml-optimizer', function () {
	runCases('should convert {0} to {1}', opt, [
		['c4d4e4f4', 'cdef'],
		['c8c8c8c4c8c8c8', 'L8cccc4ccc'],
		['c8c8c4c8c8', 'L8ccc4cc'],
		['c8c4c8c8', 'c8cc8c8'],
		['c16c4c16c16', 'L16cc4cc'],
		['c4c4.c4c4.', 'cc.cc.'],
		['c4c4.c4.c4.c4', 'cc.c.c.c'],
		['c4c4.c4.c4.c4.', 'cL4.cccc'],
		['c4c4..c4c4..c4', 'cc..cc..c'],
		['c4c4...c4c4...c4', 'cc...cc...c'],
		['c4.c4..c4.c4..c4.', 'L4.cc.cc.c'],
		['c4..c4...c4..c4...c4..', 'L4..cc.cc.c'],
		['c30c30c30c30c30...','L30ccccc9'],
		['c16.c16c16.c16c16.c16c16.c16', 'L16c.cc.cc.cc.c'],
		['L18ccccccL12cc', 'L18ccccccc.c.'],
		['c64c43c64c43', 'L64cc.cc.'],
		['L64ccccc.c.c.c.', 'L64ccccL43cccc'],
		['O4gO5gO4gO7gO6g', '<g>g<gO7g<g'],
		['b>c>c<b<b>d', 'b>cb+bc-d'],
		['O1c>>>c<<<c', 'O1cO4cO1c'],
		['n12n48n12', 'O2cO5cO2c'],
		['O1r>>>r<<<r>>>r', 'rrrr']
	]);

	it('should use custom options', function () {
		assert.equal(opt('V15O3g3.'), 'V15O3g3.');
		assert.equal(opt('V15O3g3.', { input: 'mabi', output: 'mabi' }), 'V15<g2');
		assert.equal(opt('V15O3g3.', { input: 'aa', output: 'mabi' }), 'V2O2g2');
		assert.equal(opt('V15O3g3.', { input: 'mabi', output: 'aa' }), 'V127<g2');
	});
});
