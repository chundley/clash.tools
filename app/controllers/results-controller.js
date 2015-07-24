'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ResultsCtrl', ['$rootScope', '$scope', '$routeParams', '$modal', '$window', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService', 'attackResultService', 'resultsCharts',
function ($rootScope, $scope, $routeParams, $modal, $window, moment, authService, cacheService, sessionService, errorService, userService, attackResultService, resultsCharts) {
    // initialize
    $rootScope.title = 'Results - clash.tools';


    $scope.filters = {
        clanId: 'all',
        th: 0,
        stars: -1
    };

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

    userService.getById($scope.viewId, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'results-controller.js', func: 'init', message: 'Error getting user' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.user = user;
            $scope.clanHistory = [];
            angular.forEach($scope.user.clan_history, function (ch) {
                var found = false;
                angular.forEach($scope.clanHistory, function (ch2) {
                    if (ch.clan_id == ch2.clan_id) {
                        found = true;
                    }
                });

                if (!found) {
                    $scope.clanHistory.push(ch);
                }
            });

            $scope.clanHistory.sort(function (a, b) {
                if (a.name >= b.name) {
                    return 1;
                }
                else if (a.name < b.name) {
                    return -1;
                }
            });
        }        
    });

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

                resultsCharts.attacksByStars($scope.summaryStats.stars, function (options) {
                    // attacks by stars
                    $scope.hcAttacksByStars = options;
                });

                $scope.applyFilters();
            }
        }
    });

    $scope.applyFilters = function() {
        $scope.filteredResults = [];
        $scope.filteredSummary = {
            stars: [0, 0, 0, 0],
            aav: 0
        };

        var totAV = 0;
        angular.forEach($scope.attackResults, function (ar) {
            var include = true;
            if ($scope.filters.clanId != 'all') {
                if (ar.c != $scope.filters.clanId) {
                    include = false;
                }
            }

            if ($scope.filters.th != 0) {
                if (ar.ot != $scope.filters.th) {
                    include = false;
                }
            }

            if ($scope.filters.stars > 0) {
                if (ar.s != $scope.filters.stars) {
                    include = false;
                }
            }

            if (include) {
                $scope.filteredResults.push(ar);
                $scope.filteredSummary.stars[ar.s]++;
                totAV += ar.v;
            }
        });        
        $scope.filteredSummary.aav = totAV / $scope.filteredResults.length;
    }

}]);