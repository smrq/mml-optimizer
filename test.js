/* jshint mocha:true */

var opt = require('./index');
var convert = require('./lib/convert');
var parse = require('./lib/parse');
var optimize = require('./lib/optimize');

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

describe('convert', function () {
	describe('noteDurationToTicks', function () {
		var options = { tpqn: 500 };
		runCases('should convert {0} to {1}', convert.noteDurationToTicks, [
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
		runCases('should convert {0} to {1}', convert.ticksToAllNoteDurations, [
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
					var ticks = convert.noteDurationToTicks(i + dots, options);
					var durations = convert.ticksToAllNoteDurations(ticks, options);
					durations.forEach(function (duration) {
						assert.equal(convert.noteDurationToTicks(duration, options),
							ticks,
							'Testing ' + i + dots);
					});
				}
			}
		});
	});

	describe('relativeDuration', function () {
		var options = { tpqn: 500, minimumNoteDuration: 64 };
		runCases('should convert {0} to {1}', convert.relativeDuration, [
			[[convert.noteDurationToTicks('4', options), '1', options], '4'],
			[[convert.noteDurationToTicks('4', options), '4', options], ''],
			[[convert.noteDurationToTicks('4', options), '4.', options], '4'],
			[[convert.noteDurationToTicks('4.', options), '4', options], '.'],
			[[convert.noteDurationToTicks('4..', options), '4.', options], '.'],
			[[convert.noteDurationToTicks('4...', options), '4.', options], '..'],
			[[convert.noteDurationToTicks('4....', options), '4.', options], '...'],
			[[convert.noteDurationToTicks('12', options), '12', options], ''],
			[[convert.noteDurationToTicks('12', options), '18', options], '.'],
			[[convert.noteDurationToTicks('12', options), '27', options], '12']
		]);
	});

	describe('noteNameToMidiPitch', function () {
		runCases('should convert {0} to {1}', convert.noteNameToMidiPitch, [
			[['c', 5], 60],
			[['c+', 5], 61],
			[['c-', 5], 59],
			[['c', 4], 48],
			[['a', 5], 69]
		]);
	});

	describe('validOctaves', function () {
		runCases('should convert {0} to {1}', convert.validOctaves, [
			[convert.noteNameToMidiPitch('g', 4), [4]],
			[convert.noteNameToMidiPitch('c', 4), [3, 4]],
			[convert.noteNameToMidiPitch('b', 4), [4, 5]],
			[convert.noteNameToMidiPitch('c', 0), [0]]
		]);
	});

	describe('midiPitchToNoteName', function () {
		runCases('should convert {0} to {1}', convert.midiPitchToNoteName, [
			[[67, 5], 'g'],
			[[68, 5], 'g+'],
			[[60, 5], 'c'],
			[[59, 5], 'c-'],
			[[59, 4], 'b'],
			[[60, 4], 'b+']
		]);
	});

	describe('roundVolume', function () {
		runCases('should convert {0} to {1}', convert.roundVolume, [
			[[[100, 127], {maxVolume: 127}], 100],
			[[[100, 127], {maxVolume: 15}], 12],
			[[[12, 15], {maxVolume: 15}], 12],
			[[[12, 15], {maxVolume: 127}], 99],
		]);
	});
});

describe('parse', function () {
	var options = {
		tpqn: 500,
		minimumNoteDuration: 64,
		defaultState: {
			octave: 4,
			tempo: 100,
			volume: [100,127],
			duration: '4'
		},
		maxVolume: 127,
		tracksShareState: true,
		octaveOffset: -1,
		transpose: 1
	};
	runCases('should parse {0}', parse, [
		[['ccc', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 }
		]],
		[['cdefgabCDEFGAB', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 51, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 53, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 54, ticks: 500, volume: [100,127], time: 1500 },
			{ type: 'note', pitch: 56, ticks: 500, volume: [100,127], time: 2000 },
			{ type: 'note', pitch: 58, ticks: 500, volume: [100,127], time: 2500 },
			{ type: 'note', pitch: 60, ticks: 500, volume: [100,127], time: 3000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 3500 },
			{ type: 'note', pitch: 51, ticks: 500, volume: [100,127], time: 4000 },
			{ type: 'note', pitch: 53, ticks: 500, volume: [100,127], time: 4500 },
			{ type: 'note', pitch: 54, ticks: 500, volume: [100,127], time: 5000 },
			{ type: 'note', pitch: 56, ticks: 500, volume: [100,127], time: 5500 },
			{ type: 'note', pitch: 58, ticks: 500, volume: [100,127], time: 6000 },
			{ type: 'note', pitch: 60, ticks: 500, volume: [100,127], time: 6500 },
		]],
		[['c#d#e#f#g#a#b#c+d+e+f+g+a+b+c-d-e-f-g-a-b-', options], [
			{ type: 'note', pitch: 50, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 52, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 54, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 55, ticks: 500, volume: [100,127], time: 1500 },
			{ type: 'note', pitch: 57, ticks: 500, volume: [100,127], time: 2000 },
			{ type: 'note', pitch: 59, ticks: 500, volume: [100,127], time: 2500 },
			{ type: 'note', pitch: 61, ticks: 500, volume: [100,127], time: 3000 },
			{ type: 'note', pitch: 50, ticks: 500, volume: [100,127], time: 3500 },
			{ type: 'note', pitch: 52, ticks: 500, volume: [100,127], time: 4000 },
			{ type: 'note', pitch: 54, ticks: 500, volume: [100,127], time: 4500 },
			{ type: 'note', pitch: 55, ticks: 500, volume: [100,127], time: 5000 },
			{ type: 'note', pitch: 57, ticks: 500, volume: [100,127], time: 5500 },
			{ type: 'note', pitch: 59, ticks: 500, volume: [100,127], time: 6000 },
			{ type: 'note', pitch: 61, ticks: 500, volume: [100,127], time: 6500 },
			{ type: 'note', pitch: 48, ticks: 500, volume: [100,127], time: 7000 },
			{ type: 'note', pitch: 50, ticks: 500, volume: [100,127], time: 7500 },
			{ type: 'note', pitch: 52, ticks: 500, volume: [100,127], time: 8000 },
			{ type: 'note', pitch: 53, ticks: 500, volume: [100,127], time: 8500 },
			{ type: 'note', pitch: 55, ticks: 500, volume: [100,127], time: 9000 },
			{ type: 'note', pitch: 57, ticks: 500, volume: [100,127], time: 9500 },
			{ type: 'note', pitch: 59, ticks: 500, volume: [100,127], time: 10000 }
		]],
		[['c2c4c8c', options], [
			{ type: 'note', pitch: 49, ticks: 1000, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 250, volume: [100,127], time: 1500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1750 }
		]],
		[['c2c2.c2..c2...', options], [
			{ type: 'note', pitch: 49, ticks: 1000, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 1500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 2250, volume: [100,127], time: 2500 },
			{ type: 'note', pitch: 49, ticks: 3375, volume: [100,127], time: 4750 }
		]],
		[['cc.c..c...', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 750, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 1125, volume: [100,127], time: 1250 },
			{ type: 'note', pitch: 49, ticks: 1687, volume: [100,127], time: 2375 }
		]],
		[['n60n30n90', options], [
			{ type: 'note', pitch: 61, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 31, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 91, ticks: 500, volume: [100,127], time: 1000 }
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
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 2000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 2500 }
		]],
		[['ccc /* this is a\nmulti line\r\ncomment v64 */ ccc', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 2000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 2500 }
		]],
		[['/* cdef /* gabc */ ccc', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 }
		]],
		[['ccL8cc', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'duration', duration: '8', time: 1000 },
			{ type: 'note', pitch: 49, ticks: 250, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 250, volume: [100,127], time: 1250 }
		]],
		[['rrL8rr', options], [
			{ type: 'rest', ticks: 500, time: 0 },
			{ type: 'rest', ticks: 500, time: 500 },
			{ type: 'duration', duration: '8', time: 1000 },
			{ type: 'rest', ticks: 250, time: 1000 },
			{ type: 'rest', ticks: 250, time: 1250 }
		]],
		[['L2cc.c..c...', options], [
			{ type: 'duration', duration: '2', time: 0 },
			{ type: 'note', pitch: 49, ticks: 1000, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 1500, volume: [100,127], time: 1000 },
			{ type: 'note', pitch: 49, ticks: 2250, volume: [100,127], time: 2500 },
			{ type: 'note', pitch: 49, ticks: 3375, volume: [100,127], time: 4750 }
		]],
		[['L4.cc.c..c...', options], [
			{ type: 'duration', duration: '4.', time: 0 },
			{ type: 'note', pitch: 49, ticks: 750, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 1125, volume: [100,127], time: 750 },
			{ type: 'note', pitch: 49, ticks: 1687, volume: [100,127], time: 1875 },
			{ type: 'note', pitch: 49, ticks: 2530, volume: [100,127], time: 3562 }
		]],
		[['o3c>c>c<c<c', options], [
			{ type: 'octave', octave: 2, time: 0 },
			{ type: 'note', pitch: 25, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'octave', octave: 3, time: 500 },
			{ type: 'note', pitch: 37, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'octave', octave: 4, time: 1000 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 },
			{ type: 'octave', octave: 3, time: 1500 },
			{ type: 'note', pitch: 37, ticks: 500, volume: [100,127], time: 1500 },
			{ type: 'octave', octave: 2, time: 2000 },
			{ type: 'note', pitch: 25, ticks: 500, volume: [100,127], time: 2000 }
		]],
		[['t180ccc', options], [
			{ type: 'tempo', tempo: 180, time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 }
		]],
		[['v64ccc', options], [
			{ type: 'volume', volume: [64,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [64,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [64,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [64,127], time: 1000 }
		]],
		[['c&c&c', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'tie' },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'tie' },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 }
		]],
		[['L8V64O2c,c,c', options], [
			{ type: 'duration', duration: '8', time: 0 },
			{ type: 'volume', volume: [64,127], time: 0 },
			{ type: 'octave', octave: 1, time: 0 },
			{ type: 'note', pitch: 13, ticks: 250, volume: [64,127], time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 13, ticks: 250, volume: [64,127], time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 13, ticks: 250, volume: [64,127], time: 0 }
		]],
		[['L8V64O2c,c,c', extend({}, options, { tracksShareState: false })], [
			{ type: 'duration', duration: '8', time: 0 },
			{ type: 'volume', volume: [64,127], time: 0 },
			{ type: 'octave', octave: 1, time: 0 },
			{ type: 'note', pitch: 13, ticks: 250, volume: [64,127], time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 }
		]],
		[['@#$ ccc !|/', options], [
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 0 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 500 },
			{ type: 'note', pitch: 49, ticks: 500, volume: [100,127], time: 1000 }
		]]
	]);
});

describe('optimize', function () {
	describe('findPath', function () {
		var options = {
			tpqn: 500,
			minimumNoteDuration: 64,
			defaultState: {
				octave: 4,
				tempo: 120,
				volume: [100,127],
				duration: '4'
			},
			maxVolume: 127,
			transpose: 0
		};
		runCases('should find a path given an input token set', optimize.findPath, [
			[[parse('cdef', options), options], [
				{ cursor: 0, octave: 4, tempo: 120, volume: [100,127], duration: '4' },
				{ cursor: 1, octave: 4, tempo: 120, volume: [100,127], duration: '4' },
				{ cursor: 2, octave: 4, tempo: 120, volume: [100,127], duration: '4' },
				{ cursor: 3, octave: 4, tempo: 120, volume: [100,127], duration: '4' },
				{ cursor: 4, octave: 4, tempo: 120, volume: [100,127], duration: '4' }
			]],
			[[parse('c16d16e32f32', options), options], [
				{ cursor: 0, octave: 4, tempo: 120, volume: [100,127], duration: '4' },
				{ cursor: 0, octave: 4, tempo: 120, volume: [100,127], duration: '16' },
				{ cursor: 1, octave: 4, tempo: 120, volume: [100,127], duration: '16' },
				{ cursor: 2, octave: 4, tempo: 120, volume: [100,127], duration: '16' },
				{ cursor: 2, octave: 4, tempo: 120, volume: [100,127], duration: '32' },
				{ cursor: 3, octave: 4, tempo: 120, volume: [100,127], duration: '32' },
				{ cursor: 4, octave: 4, tempo: 120, volume: [100,127], duration: '32' }
			]]
		]);
	});

	describe('optimize', function () {
		var options = {
			tpqn: 500,
			minimumNoteDuration: 64,
			defaultState: {
				octave: 4,
				tempo: 120,
				volume: [100,127],
				duration: '4'
			},
			maxVolume: 127,
			transpose: 0
		};
		runCases('should return an optimized token set', optimize, [
			[[parse('cdef', options), options], [
				{ type: 'note', pitch: 48, ticks: 500, volume: [100,127], time: 0 },
				{ type: 'note', pitch: 50, ticks: 500, volume: [100,127], time: 500 },
				{ type: 'note', pitch: 52, ticks: 500, volume: [100,127], time: 1000 },
				{ type: 'note', pitch: 53, ticks: 500, volume: [100,127], time: 1500 }
			]],
			[[parse('c16d16e32f32', options), options], [
				{ type: 'duration', duration: '16', time: 0 },
				{ type: 'note', pitch: 48, ticks: 125, volume: [100,127], time: 0 },
				{ type: 'note', pitch: 50, ticks: 125, volume: [100,127], time: 125 },
				{ type: 'duration', duration: '32', time: 250 },
				{ type: 'note', pitch: 52, ticks: 62, volume: [100,127], time: 250 },
				{ type: 'note', pitch: 53, ticks: 62, volume: [100,127], time: 312 }
			]]
		]);
	});
});

describe('mml-optimizer', function () {
	runCases('should convert {0} to {1}', opt, [
		['c4d4e4f4', 'cdef'],
		['c8c8c8c4c8c8c8', 'l8cccc4ccc'],
		['c8c8c4c8c8', 'l8ccc4cc'],
		['c8c4c8c8', 'c8cc8c8'],
		['c16c4c16c16', 'l16cc4cc'],
		['c4c4.c4c4.', 'cc.cc.'],
		['c4c4.c4.c4.c4', 'cc.c.c.c'],
		['c4c4.c4.c4.c4.', 'cl4.cccc'],
		['c4c4..c4c4..c4', 'cc..cc..c'],
		['c4c4...c4c4...c4', 'cc...cc...c'],
		['c4.c4..c4.c4..c4.', 'l4.cc.cc.c'],
		['c4..c4...c4..c4...c4..', 'l4..cc.cc.c'],
		['c30c30c30c30c30...','l30ccccc9'],
		['c16.c16c16.c16c16.c16c16.c16', 'l16c.cc.cc.cc.c'],
		['l18ccccccl12cc', 'l18ccccccc.c.'],
		['c64c43c64c43', 'l64cc.cc.'],
		['l64ccccc.c.c.c.', 'l64ccccl43cccc'],
		['o4go5go4go7go6g', '<g>g<go7g<g'],
		['b>c>c<b<b>d', 'b>cb+bc-d'],
		['o1c>>>c<<<c', 'o1co4co1c'],
		['n12n48n12', 'o1co4co1c'],
		['o1r>>>r<<<r>>>r', 'rrrr'],
		['v15v15v15c', 'v15c'],
		['t60t60t60c', 't60c'],
		['o1o1o1c', 'o1c'],
		['l8l8l8c', 'c8']
	]);

	it('should handle the maxVolume option', function () {
		assert.equal(opt('v15o2g', { input: 'aa', output: 'aa' }), 'v15o2g');
		assert.equal(opt('v15o2g', { input: 'mabi', output: 'mabi' }), 'v15o2g');
		assert.equal(opt('v15o2g', { input: 'aa', output: 'mabi' }), 'v2o2g');
		assert.equal(opt('v15o2g', { input: 'mabi', output: 'aa' }), 'v127o2g');
	});

	it('should handle the default volume option', function () {
		assert.equal(opt('o2g', { input: 'aa', output: 'aa' }), 'o2g');
		assert.equal(opt('o2g', { input: 'mabi', output: 'mabi' }), 'o2g');
		assert.equal(opt('o2g', { input: 'aa', output: 'mabi' }), 'v12o2g');
		assert.equal(opt('o2g', { input: 'mabi', output: 'aa' }), 'v68o2g');
	});

	it('should handle the tpqn option', function () {
		assert.equal(opt('v15o2g3.', { input: 'aa', output: 'aa' }), 'v15o2g3.');
		assert.equal(opt('v15o2g3.', { input: 'mabi', output: 'mabi' }), 'v15o2g2');
		assert.equal(opt('v15o2g3.', { input: 'aa', output: 'mabi' }), 'v2o2g2');
		assert.equal(opt('v15o2g3.', { input: 'mabi', output: 'aa' }), 'v127o2g3.');
	});

	it('should handle transposition', function () {
		assert.equal(opt('v15o3g3.', { input: 'aa', output: 'aa', transpose: 3 }), 'v15o3a+3.');
		assert.equal(opt('v15o3g3.', { input: 'aa', output: 'aa', transpose: 12 }), 'v15<g3.');
	});

	it('should slightly fudge volume values to save a character', function () {
		assert.equal(opt('v12o2g', { input: 'mabi', output: 'aa' }), 'v99o2g');
	});
});
