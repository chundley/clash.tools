'use strict';

/*
*   Controller for war team page
*/

angular.module('Clashtools.controllers')
.controller('WarSummaryCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'ctSocket', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService', 'attackResultService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, ctSocket, authService, sessionService, errorService, messagelogService, clanService, warService, attackResultService) {

    $scope.warId = $routeParams.id;
    $scope.activeWar = false;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;

        if ($scope.meta.current_clan.clan_id) {
            clanService.getById($scope.meta.current_clan.clan_id, function (err, clan) {
                if (err) {
                    err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting clan' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.clan = clan;


                    // needed for avatars
                    clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {
                        $scope.members = members;

                        // load war initially
                        loadWar(function(){
                            if ($scope.war) {
                                $rootScope.title = 'War vs. ' + $scope.war.opponent_name + ' - clash.tools';
                                // and after that any time a change is broadcast by socket.io
                                ctSocket.on('war:' + $scope.war._id + ':change', function (data) {
                                    loadWar(function(){});
                                });
                            }
                        });
                    });
                }
            });
        }
    });

    function loadWar(callback) {
        warService.getById($scope.warId, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'loadWar', message: 'Error getting current war' } );
                errorService.save(err, function() {});
                callback();
            }
            else {
                if (war) {
                    $scope.war = war;
                    if (war.active) {
                        $scope.activeWar = true;
                    }

                    attackResultService.getByWarId(war._id, function (err, attackResults) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'war-controller.js', func: 'loadWar', message: 'Error getting current war' } );
                            errorService.save(err, function() {});
                            callback();
                        }
                        else {
                            $scope.attackResults = attackResults;
                            refreshInterface();
                            callback();
                        }
                    });
                }
                else {
                    callback();
                }
            }
        });
    }

    function refreshInterface() {
        var now = new Date();
        var warStart = new Date($scope.war.start);
        var possibleExpireDate = new Date(now.getTime() + ($scope.clan.war_config.cleanup_attack_time*60*60*1000));
        var freeForAllDate = new Date(warStart.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));
        var warEnd = new Date(warStart.getTime() + (24*60*60*1000));

        var now = new Date();

        if (warStart.getTime() <= now.getTime()) {
            // war has started, set the end time to +24 hours from start
            $scope.warStartTime = warStart.getTime() + 24*60*60*1000;
            $scope.warStarted = true;
        }
        else {
            $scope.warStartTime = warStart.getTime();
            $scope.warStarted = false;
        }

        $scope.warEnded = false;
        if (warEnd.getTime() <= now.getTime()) {
            $scope.warEnded = true;
        }

        $scope.$broadcast('timer-start');

        $scope.summaryStats = {
            totalStars: 0,
            3: 0,
            2: 0,
            1: 0,
            0: 0,
        };

        angular.forEach($scope.war.bases, function (base) {
            var maxStars = null;
            angular.forEach(base.a, function (assignment) {
                if (assignment.s != null && assignment.s > maxStars) {
                    maxStars = assignment.s;
                }

                // need this case for zero stars since the above comparison won't pick it up
                if (maxStars == null && assignment.s==0) {
                    maxStars = 0;
                }
            });

            $scope.summaryStats[maxStars]++;
            $scope.summaryStats.totalStars += maxStars;
        });

        $scope.totAttackValue = [];
        angular.forEach($scope.attackResults, function (result) {
            var addedIndex = -1;
            for (var idx=0; idx<$scope.totAttackValue.length; idx++) {
                if (result.u == $scope.totAttackValue[idx].u) {
                    addedIndex = idx;
                }
            }

            if (addedIndex >= 0) {
                $scope.totAttackValue[addedIndex].a.push({
                    r: result.r,
                    or: result.or,
                    t: result.t,
                    ot: result.ot,
                    s: result.s,
                    v: result.v
                });

                $scope.totAttackValue[addedIndex].totV += result.v
            }
            else {
                // new
                var newTot = {
                    u: result.u,
                    i: result.i,
                    a: [{
                        r: result.r,
                        or: result.or,
                        t: result.t,
                        ot: result.ot,
                        s: result.s,
                        v: result.v
                    }],
                    totV: result.v
                };
                $scope.totAttackValue.push(newTot);
            }
        });

        $scope.totAttackValue.sort( function (a, b) {
            if (a.totV > b.totV) {
                return -1;
            }
            else if (a.totV < b.totV) {
                return 1;
            }
            else {
                if (a.a[0].t < b.a[0].t) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        });

        $scope.myIndex = -1;
        for (var idx=0; idx< $scope.totAttackValue.length; idx++) {
            if ($scope.totAttackValue[idx].u == authService.user.id) {
                $scope.myIndex = idx;
            }

            var found = false;
            angular.forEach($scope.members, function (member) {
                if (member._id == $scope.totAttackValue[idx].u) {
                    $scope.totAttackValue[idx].avatar = member.profile.avatar;
                    found = true;
                }
            });
            if (!found) {
                $scope.totAttackValue[idx].avatar = "000000000000000000000000.png";
            }
        }

        if ($scope.myIndex > 4) {
            // this user is in the war but not in the top 5
            $scope.myRank = $scope.totAttackValue[$scope.myIndex];
        }
    }
}]);
