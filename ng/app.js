var app = angular.module('app', []);

app.controller('GameController', function ($scope, GameService) {
	$scope.submitEntry = function () {
		if (typeof $scope.name === 'undefined' || typeof $scope.word === 'undefined') {
			return;
		}
		var entry = {
			name: $scope.name,
			word: $scope.word
		};
		GameService.submitEntry(entry)
			.success(function (points) {
				$scope.word = undefined;
				GameService.getScores()
					.success(function (scores) {
						$scope.scores = scores;
					});
			});
	};

	// ADDITION: resetScores capability for devmode
	$scope.resetScores = function () {
		GameService.resetScores()
			.success(function () {
				GameService.getScores()
					.success(function (scores) {
						$scope.scores = scores;
					});
			});
	};

	// ALTERATION: start by retrieving the env (possibly devmode) from the back end
	// facilitates devmode reset button
	GameService.getEnv()
		.success(function (env) {
			$scope.env = env;

			GameService.getScores()
				.success(function (scores) {
					$scope.scores = scores;
				});
		});
});

app.service('GameService', function ($http) {
	// ADDITION: env retrieval
	this.getEnv = function () {
		return $http.get('/api/env');
	}
	this.getScores = function () {
		return $http.get('/api/getScores');
	};
	this.submitEntry = function (entry) {
		return $http.post('/api/submitEntry', entry);
	};
	// ADDITION: scoreboard reset
	this.resetScores = function () {
		return $http.post('/api/resetScores');
	}
});
