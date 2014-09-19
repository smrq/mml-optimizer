var opt = require('./index.js');
var assert = require('assert');
var fmt = require('simple-fmt');

function runCases(text, fn, cases) {
	cases.forEach(function (testCase) {
		var input = testCase[0], output = testCase[1];
		it(fmt(text, input, output), function () {
			assert.deepEqual(output, fn(input));
		});
	});
}

describe('noteDurationToTicks', function () {
	runCases('should convert {0} to {1}', opt.noteDurationToTicks, [
		['1', 384],
		['1.', 576],
		['4', 96],
		['4.', 144],
		['5', 76],
		['5.', 114],
		['7', 54],
		['7.', 81],
		['64', 6],
		['64.', 9],
		['42', 9]
	]);
});

describe('ticksToNoteDuration', function () {
	runCases('should convert {0} to {1}', opt.ticksToNoteDuration, [
		[384, '1'],
		[576, '1.'],
		[96, '4'],
		[144, '4.'],
		[76, '5'],
		[114, '5.'],
		[54, '7'],
		[81, '7.'],
		[6, '64'],
		[9, '42']
	]);
});

describe('parseMml', function () {
	runCases('should parse {0}', opt.parseMml, [
		['ccc', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['cdefgabCDEFGAB', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'd', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'e', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'f', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'g', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'a', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'b', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'd', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'e', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'f', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'g', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'a', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'b', octave: 4, ticks: 96, volume: 100 }
		]],
		['c#d#e#f#g#a#b#c+d+e+f+g+a+b+c-d-e-f-g-a-b-', [
			{ type: 'note', pitch: 'c+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'd+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'e+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'f+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'g+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'a+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'b+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'd+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'e+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'f+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'g+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'a+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'b+', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'd-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'e-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'f-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'g-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'a-', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'b-', octave: 4, ticks: 96, volume: 100 }
		]],
		['c2c4c8c', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 192, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 48, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['ccc /* this is a comment v64 */ ccc', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['ccc /* this is a\nmulti line\r\ncomment v64 */ ccc', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['ccL8cc', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 48, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 48, volume: 100 }
		]],
		['o2c>c>c<c<c', [
			{ type: 'octave', octave: 2 },
			{ type: 'note', pitch: 'c', octave: 2, ticks: 96, volume: 100 },
			{ type: 'octaveUp' },
			{ type: 'note', pitch: 'c', octave: 3, ticks: 96, volume: 100 },
			{ type: 'octaveUp' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'octaveDown' },
			{ type: 'note', pitch: 'c', octave: 3, ticks: 96, volume: 100 },
			{ type: 'octaveDown' },
			{ type: 'note', pitch: 'c', octave: 2, ticks: 96, volume: 100 }
		]],
		['t180ccc', [
			{ type: 'tempo', tempo: 180 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['v64ccc', [
			{ type: 'volume', volume: 64 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 64 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 64 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 64 }
		]],
		['c&c&c', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'tie' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'tie' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['c,c,c', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'nextVoice' },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]],
		['@#$ ccc !|/', [
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 },
			{ type: 'note', pitch: 'c', octave: 4, ticks: 96, volume: 100 }
		]]
	]);
});

describe('mml-optimizer', function () {
	runCases('should optimize {0} to {1}', opt, [
		['c4d4e4f4', 'cdef'],
		['c8c8c8c4c8c8c8', 'L8cccc4ccc'],
		['c8c8c4c8c8', 'L8ccc4cc'],
		['c8c4c8c8', 'c8cc8c8'],
		['c16c4c16c16', 'L16cc4cc']
	]);
});