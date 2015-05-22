'use strict';

/*
*   Controller for clan roster page
*/

angular.module('Clashtools.controllers')
.controller('RosterCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'attackResultService',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, attackResultService) {

    $scope.filter = 'current';
    $scope.order = 't';
    $scope.reverse = true;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'members-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $rootScope.title = meta.current_clan.name + ' clan roster';

            attackResultService.getByClanId($scope.meta.current_clan.clan_id, function (err, results) {
                if (err) {
                    err.stack_trace.unshift( { file: 'roster-controller.js', func: 'init', message: 'Error getting attack results' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.attackResults = results;
                    clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'members-controller.js', func: 'init', message: 'Error getting clan members' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            angular.forEach(members, function (member) {
                                member.joined = new moment(member.current_clan.joined);
                            });
                            $scope.members = members;

                            // create collection for the UI
                            $scope.memberResults = [];

                            angular.forEach($scope.attackResults, function (ar) {
                                var addedIndex = -1;
                                for (var idx=0; idx<$scope.memberResults.length; idx++) {
                                    if ($scope.memberResults[idx].u == ar.u) {
                                        addedIndex = idx;
                                    }
                                }

                                if (addedIndex < 0) {
                                    var newRow = {
                                        u: ar.u,
                                        i: ar.i,
                                        t: parseInt(ar.t),
                                        current: false,
                                        totAttacks: 1,
                                        totAttackValue: ar.v,
                                        avgAttackValue: ar.v,
                                        stars: [0, 0, 0, 0]
                                    };

                                    newRow.stars[ar.s] = 1;
                                    if (ar.s==3) {
                                        newRow.threeRate = 100;
                                    }
                                    else {
                                        newRow.threeRate = 0;
                                    }

                                    angular.forEach($scope.members, function (member) {
                                        if (member._id == ar.u) {
                                            newRow.current = true;
                                        }
                                    });

                                    $scope.memberResults.push(newRow);
                                }
                                else {
                                    $scope.memberResults[addedIndex].stars[ar.s]++;
                                    $scope.memberResults[addedIndex].totAttacks++;
                                    $scope.memberResults[addedIndex].totAttackValue += ar.v;
                                    $scope.memberResults[addedIndex].avgAttackValue = $scope.memberResults[addedIndex].totAttackValue / $scope.memberResults[addedIndex].totAttacks;
                                    $scope.memberResults[addedIndex].threeRate = $scope.memberResults[addedIndex].stars[3] / $scope.memberResults[addedIndex].totAttacks * 100;
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    $scope.filterTable = function(row) {
        if ($scope.filter == 'all') {
            return true;
        }
        else if ($scope.filter == 'current') {
            return row.current;
        }
        else if ($scope.filter == 'past') {
            return !row.current;
        }
    }

}]);
