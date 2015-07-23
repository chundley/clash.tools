'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ResultsCtrl', ['$rootScope', '$scope', '$routeParams', '$modal', '$window', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService', 'attackResultService', 'resultsCharts',
function ($rootScope, $scope, $routeParams, $modal, $window, moment, authService, cacheService, sessionService, errorService, userService, attackResultService, resultsCharts) {
    // initialize
    $rootScope.title = 'Results - clash.tools';

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
    });

    if ($routeParams.id) {
        $scope.viewId = $routeParams.id;
        $scope.leader = true;
    }
    else {
        $scope.viewId = authService.user.id;
        $scope.leader = false;
    }

    attackResultService.getByUserId($scope.viewId, function (err, results) {
        if (err) {
            err.stack_trace.unshift( { file: 'results-controller.js', func: 'init', message: 'Error getting attack results' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.attackResults = results;

            $scope.summaryStats = {
                stars: [0, 0, 0, 0],
                aav: 0
            };

            if ($scope.attackResults.length > 0) {

                $scope.attackResults.sort(function (a,b) {
                    var aDate = new Date(a.we);
                    var bDate = new Date(b.we);
                    if (aDate > bDate) {
                        return -1;
                    }
                    else if (aDate < bDate) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });

                var totAV = 0;
                angular.forEach($scope.attackResults, function (ar) {
                    $scope.summaryStats.stars[ar.s]++;
                    totAV += ar.v;

                    var warEnd = new Date(ar.we);
                    ar.ended = new moment(warEnd);
                });
                $scope.summaryStats.aav = totAV / $scope.attackResults.length;

                $scope.filteredResults =
                {
                    detail: $scope.attackResults
                };


               resultsCharts.attacksByStars($scope.summaryStats.stars, function (options) {
                    // attacks by stars
                    $scope.hcAttacksByStars = options;
                });
            }
        }
    });
}]);