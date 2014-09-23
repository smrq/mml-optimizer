var opt = require('./index.js');
var assert = require('assert');
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
	runCases('should convert {0} to {1}', opt.noteDurationToTicks, [
		['1', 2000],
		['1.', 3000],
		['1..', 4500],
		['1...', 6750],
		['3', 666],
		['3.', 999],
		['4', 500],
		['4.', 750],
		['5', 400],
		['5.', 600],
		['7', 285],
		['7.', 427],
		['64', 31],
		['64.', 46]
	]);
});

describe('ticksToNoteDuration', function () {
	runCases('should convert {0} to {1}', opt.ticksToNoteDuration, [
		[2000, '1'],
		[3000, '1.'],
		[4500, '1..'],
		[6750, '1...'],
		[666, '3'],
		[999, '3.'],
		[500, '4'],
		[750, '4.'],
		[400, '5'],
		[600, '5.'],
		[285, '7'],
		[427, '7.'],
		[31, '64'],
		[46, '43']
	]);

	it('should convert ticks to duration and back', function () {
		for (var i = 1; i <= 64; ++i) {
			var ticks;

			ticks = opt.noteDurationToTicks(i + '');
			assert.equal(opt.noteDurationToTicks(opt.ticksToNoteDuration(ticks)), ticks, 'Testing ' + i);

			ticks = opt.noteDurationToTicks(i + '.');
			assert.equal(opt.noteDurationToTicks(opt.ticksToNoteDuration(ticks)), ticks, 'Testing ' + i + '.');

			ticks = opt.noteDurationToTicks(i + '..');
			assert.equal(opt.noteDurationToTicks(opt.ticksToNoteDuration(ticks)), ticks, 'Testing ' + i + '..');
		}
	});
});

describe('ticksToAllNoteDurations', function () {
	runCases('should convert {0} to {1}', opt.ticksToAllNoteDurations, [
		[2000, ['1']],
		[3000, ['1.']],
		[4500, ['1..']],
		[6750, ['1...']],
		[333, ['6', '9.', '30....', '45.....']],
		[166, ['12', '18.', '27..']],
		[111, ['18', '27.']],
		[61, ['48.']]
	]);
});

describe('relativeDuration', function () {
	runCases('should convert {0} to {1}', opt.relativeDuration, [
		[[opt.noteDurationToTicks('4'), '1'], '4'],
		[[opt.noteDurationToTicks('4'), '4'], ''],
		[[opt.noteDurationToTicks('4'), '4.'], '4'],
		[[opt.noteDurationToTicks('4.'), '4'], '.'],
		[[opt.noteDurationToTicks('4..'), '4.'], '.'],
		[[opt.noteDurationToTicks('4...'), '4.'], '..'],
		[[opt.noteDurationToTicks('4....'), '4.'], '...'],
		[[opt.noteDurationToTicks('12'), '12'], ''],
		[[opt.noteDurationToTicks('12'), '18'], '.'],
		[[opt.noteDurationToTicks('12'), '27'], '12']
	]);
});

describe('parseMml', function () {
	runCases('should parse {0}', opt.parseMml, [
		['ccc', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['cdefgabCDEFGAB', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'd', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'e', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'f', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'g', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'a', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'b', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'd', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'e', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'f', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'g', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'a', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'b', octave: 5, ticks: 500, volume: 100 }
		]],
		['c#d#e#f#g#a#b#c+d+e+f+g+a+b+c-d-e-f-g-a-b-', [
			{ type: 'note', pitch: 'c+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'd+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'e+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'f+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'g+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'a+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'b+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'd+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'e+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'f+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'g+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'a+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'b+', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'd-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'e-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'f-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'g-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'a-', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'b-', octave: 5, ticks: 500, volume: 100 }
		]],
		['c2c4c8c', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1000, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 250, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['c2c2.c2..c2...', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1000, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 2250, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 3375, volume: 100 }
		]],
		['cc.c..c...', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 750, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1125, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1687, volume: 100 }
		]],
		['ccc /* this is a comment v64 */ ccc', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['ccc /* this is a\nmulti line\r\ncomment v64 */ ccc', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['ccL8cc', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 250, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 250, volume: 100 }
		]],
		['L2cc.c..c...', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1000, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 2250, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 3375, volume: 100 }
		]],
		['L4.cc.c..c...', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 750, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1125, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 1687, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 2530, volume: 100 }
		]],
		['o2c>c>c<c<c', [
			{ type: 'octave', octave: 2 },
			{ type: 'note', pitch: 'c', octave: 2, ticks: 500, volume: 100 },
			{ type: 'octaveUp' },
			{ type: 'note', pitch: 'c', octave: 3, ticks: 500, volume: 100 },
			{ type: 'octaveUp' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 500, volume: 100 },
			{ type: 'octaveDown' },
			{ type: 'note', pitch: 'c', octave: 3, ticks: 500, volume: 100 },
			{ type: 'octaveDown' },
			{ type: 'note', pitch: 'c', octave: 2, ticks: 500, volume: 100 }
		]],
		['t180ccc', [
			{ type: 'tempo', tempo: 180 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['v64ccc', [
			{ type: 'volume', volume: 64 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 64 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 64 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 64 }
		]],
		['c&c&c', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'tie' },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'tie' },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['c,c,c', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]],
		['@#$ ccc !|/', [
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 5, ticks: 500, volume: 100 }
		]]
	]);
});

describe('runPathfinder', function () {
	runCases('should find a path given an input token set', opt.runPathfinder, [
		[[opt.parseMml('cdef')], [
			{ cursor: 0, octave: 5, tempo: 100, volume: 100, duration: '4' },
			{ cursor: 1, octave: 5, tempo: 100, volume: 100, duration: '4' },
			{ cursor: 2, octave: 5, tempo: 100, volume: 100, duration: '4' },
			{ cursor: 3, octave: 5, tempo: 100, volume: 100, duration: '4' },
			{ cursor: 4, octave: 5, tempo: 100, volume: 100, duration: '4' }
		]],
		[[opt.parseMml('c16d16e32f32')], [
			{ cursor: 0, octave: 5, tempo: 100, volume: 100, duration: '4' },
			{ cursor: 0, octave: 5, tempo: 100, volume: 100, duration: '16' },
			{ cursor: 1, octave: 5, tempo: 100, volume: 100, duration: '16' },
			{ cursor: 2, octave: 5, tempo: 100, volume: 100, duration: '16' },
			{ cursor: 2, octave: 5, tempo: 100, volume: 100, duration: '32' },
			{ cursor: 3, octave: 5, tempo: 100, volume: 100, duration: '32' },
			{ cursor: 4, octave: 5, tempo: 100, volume: 100, duration: '32' }
		]]
	]);
});

describe('mml-optimizer', function () {
	runCases('should optimize {0} to {1}', opt, [
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
		['L64cccc.c.c.', 'L64cccL43ccc'],
		//['b>c<b>d', 'bb+b>d'], // or b>cc-d
		//['O1c>>>c<<<c', 'O1cO4cO1c'],
	]);
});
