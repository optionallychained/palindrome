var express = require('express');

var app = express();

app.use(express.static(__dirname));
app.use(express.json());

// completely unnecessary due to a flaw in the usage of express.static()
// fun problem: you can request localhost:3000/index.js to retrieve this file (or any other) :)
// app.get('/', function (req, res) {
// 	res.render('index.html');
// });

var port = 3000;
app.listen(port, function () {
	console.log('Server', process.pid, 'listening on port', port);
});

// in-memory storage of scores
var scores = [];

// maximum number of scores to store; makes the scoreboard of configurable length
// could make this an environment thing to allow alteration on reboot
var scoreStorage = 5;

// GET /api/env - for facilitating a devmode-only "reset" button on the front end
// see package.json -> 'dev' task for details
app.get('/api/env', function (req, res) {
	res.send(process.env.NODE_ENV);
});

// GET /api/getScores - just spit out the stored scores
app.get('/api/getScores', function (req, res) {
	res.send(scores);
});

// POST /api/submitEntry - for submitting a {name, word} object to be analysed and maybe-recorded
app.post('/api/submitEntry', function (req, res) {
	var entry = req.body;

	if (testEntry(entry.word)) {
		// by nature, we're only recording entries that should replace an item in scores
		recordEntry(entry);

		return res.status(201).json(entry.word.length);
	};

	res.status(200).json(0);
});

// POST /api/resetScores - for clearing stored scores, if we're in devmode
app.post('/api/resetScores', function (req, res) {
	if (app.get('env') === 'development') {
		scores = [];
		return res.status(200).json();
	}

	res.status(403).json();
});

/**
 * Test a given entry for whether or not it is a palindrome, and then whether or not it beats any of the stored scores
 * 
 * @param word the word to test
 * 
 * @returns a boolean indicating whether or not we need to store this entry
 */
function testEntry(word) {
	var wordTrunc = word.replace(/\s/g, '');
	var wordReverse = wordTrunc.split('').reverse().join('');
	var palindrome = wordTrunc === wordReverse;

	// intentionally don't usurp ties at the end of the array (you must beat even the lowest existing entry to get on the scoreboard)
	// allow any entry as long as there are less than scoreStorage entries
	var highscore = scores.length < scoreStorage || word.length > scores[scores.length - 1].points;

	return palindrome && highscore;
}

/**
 * Inserts a positively-tested entry into the scores array in the proper place
 * 
 * In combination with testEntry(), effectively means that we're always storing only the top5 entries ever submitted, implicitly in the correct order
 * 
 * This is possibly the most efficient solution to the task as written
 * 
 * @param entry the entry to record
 */
function recordEntry(entry) {
	var actual = { name: entry.name, points: entry.word.length };

	// find the index to insert the entry into
	var index = scores.findIndex(function (score) {
		return score.points <= actual.points;
	});

	// insert the new entry
	scores.splice(index, 0, actual);

	// trim the scores array if it exceeds the maximum number of entries
	if (scores.length > scoreStorage) {
		scores.splice(scoreStorage, 1);
	}
}