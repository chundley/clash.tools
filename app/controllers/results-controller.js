'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ResultsCtrl', ['$rootScope', '$scope', '$interval', '$modal', '$window', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService', 'attackResultService',
function ($rootScope, $scope, $interval, $modal, $window, moment, authService, cacheService, sessionService, errorService, userService, attackResultService) {
    // initialize
    $rootScope.title = 'Results - clash.tools';

    userService.getById(authService.user.id, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'results-controller.js', func: 'init', message: 'Error getting user' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.user = user;
        }
    });

    attackResultService.getByUserId(authService.user.id, function (err, results) {
        if (err) {
            err.stack_trace.unshift( { file: 'results-controller.js', func: 'init', message: 'Error getting attack results' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.attackResults = results;
            console.log($scope.attackResults[0]);

            $scope.summaryStats = {
                stars: [0, 0, 0, 0],
                threeStars: 0,
                twoStars: 0,
                oneStars: 0,
                zeroStars: 0,
                threeStarRate: 0,
                aav: 0
            };

            if ($scope.attackResults.length > 0) {
                var numThrees = 0;
                var totAV = 0;
                angular.forEach($scope.attackResults, function (ar) {
                    $scope.summaryStats.stars[ar.s]++;
                    if (ar.s == 3) {
                        numThrees++;
                        
                    }


                    totAV += ar.v;
                });

                $scope.summaryStats.threeStarRate = numThrees / $scope.attackResults.length * 100;
                $scope.summaryStats.aav = totAV / $scope.attackResults.length;
                console.log($scope.summaryStats);
            }
        }
    });

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
    });



}]);