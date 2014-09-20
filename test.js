var opt = require('./index.js');
var assert = require('assert');
var fmt = require('simple-fmt');

function runCases(text, fn, cases) {
	cases.forEach(function (testCase) {
		var input = testCase[0], output = testCase[1];
		it(fmt(text, input, output), function () {
			assert.deepEqual(fn(input), output);
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

describe('mml-optimizer', function () {
	runCases('should optimize {0} to {1}', opt, [
		['c4d4e4f4', 'cdef'],
		['c8c8c8c4c8c8c8', 'L8cccc4ccc'],
		['c8c8c4c8c8', 'L8ccc4cc'],
		['c8c4c8c8', 'c8cc8c8'],
		['c16c4c16c16', 'L16cc4cc'],
		//['c4c4.c4c4.', 'cc.cc.'],
		//['c4c4.c4.c4.c4', 'cc.c.c.c'],
		['c4c4.c4.c4.c4.', 'cL4.cccc'],
		//['L24ccccccL16cc', 'L24ccccccc.c.'],
		//['c64c43c64c43', 'L64cc.cc.'],
		//['b>c<b>d', 'bb+b>d'], // or b>cc-d
		//['O1c>>>c<<<c', 'O1cO4cO1c'],
	]);
});
