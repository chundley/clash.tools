'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ResultsCtrl', ['$rootScope', '$scope', '$interval', '$modal', '$window', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService', 'attackResultService', 'resultsCharts',
function ($rootScope, $scope, $interval, $modal, $window, moment, authService, cacheService, sessionService, errorService, userService, attackResultService, resultsCharts) {
    // initialize
    $rootScope.title = 'Results - clash.tools';

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
        console.log(meta);
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
                aav: 0
            };

            if ($scope.attackResults.length > 0) {
                var totAV = 0;
                angular.forEach($scope.attackResults, function (ar) {
                    $scope.summaryStats.stars[ar.s]++;
                    totAV += ar.v;
                });
                $scope.summaryStats.aav = totAV / $scope.attackResults.length;
                console.log($scope.summaryStats);

               resultsCharts.attacksByStars($scope.summaryStats.stars, function (options) {
                    // attacks by stars
                    $scope.hcAttacksByStars = options;
                });                
            }
        }
    });
}]);