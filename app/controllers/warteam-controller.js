'use strict';

/*
*   Controller for war team page
*/

angular.module('Clashtools.controllers')
.controller('WarTeamCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'ctSocket', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, ctSocket, authService, sessionService, errorService, messagelogService, clanService, warService) {

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

                }
            });
        }
    });

    $scope.numBases = function() {
        if ($scope.war) {
            return $scope.war.player_count;
        }
        else {
            return 0;
        }
    }

    $scope.changeStars = function(assignmentIndex, baseNum, userId, ign, numStars) {
        var playerIndex = -1;
        for (var idx=0; idx<$scope.war.team.length; idx++) {
            if ($scope.war.team[idx].u == userId) {
                playerIndex = idx;
            }
        }

        var endDate = new Date($scope.war.start);
        endDate = new Date(endDate.getTime() + 24*60*60*1000);

        var update = {
            aIndex: assignmentIndex,
            bIndex: baseNum - 1,
            pIndex: playerIndex,
            stars: numStars,
            c: $scope.meta.current_clan.clan_id,
            u: userId,
            i: ign,
            cn: $scope.meta.current_clan.name,
            t: $scope.war.team[playerIndex].t,
            ot: parseInt($scope.war.bases[baseNum-1].t),
            we: endDate
        };

        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.changeStars', message: 'Error updating stars' } );
                errorService.save(err, function() {});
            }
            else {
                // Log this activity
                var starsText = 'stars';
                if (numStars == 1) {
                    starsText = 'star';
                }

                var msgText = '[ign] attacked base ' + (baseNum) + ' for ' + numStars + ' ' + starsText;
                if (ign != $scope.meta.ign) {
                    // someone is updating someone else's stars
                    msgText = '[ign] attacked base ' + (baseNum) + ' for ' + numStars + ' ' + starsText + ' (' + $scope.meta.ign + ' updated)';
                }

                messagelogService.save($scope.meta.current_clan.clan_id, msgText, ign, 'attack', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });
            }
        });
    }

    $scope.deleteCall = function(assignmentIndex, baseNum, userId, ign) {
        // delete works differently because removing an item from an array in
        // MongoDb requires a value (in this case, userId)
        var update = {
            u: userId,
            bIndex: baseNum - 1,
            stars: -1
        };

        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.deleteCall', message: 'Error deleting call' } );
                errorService.save(err, function() {});
            }
            else {
                var msgText = '[ign]\'s call on base ' + baseNum + ' removed by ' + $scope.meta.ign;
                if ($scope.meta.ign == ign) {
                    msgText = '[ign] removed call on base ' + baseNum;
                }
                messagelogService.save($scope.meta.current_clan.clan_id, msgText, ign, 'delete', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });
                refreshInterface();
            }
        });
    }

    $scope.assignBase = function(baseNum, userId, ign) {
        // re-load the war to reduce chances of a double assign
        loadWar(function() {
            var open = false;
            var now = new Date();
            var warStart = new Date($scope.war.start);
            var possibleExpireDate = new Date(now.getTime() + ($scope.clan.war_config.cleanup_attack_time*60*60*1000));
            var freeForAllDate = new Date(warStart.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));
            var warEnd = new Date(warStart.getTime() + (24*60*60*1000));

            if ($scope.clan.war_config.overcalls) {
                // if overcalls are allowed we don't care if the base has already been reserved
                open = true;
            }
            else if (now.getTime() >= freeForAllDate.getTime()) {
                // if we are in the free for all period, overcalls are allowed no matter what
                open = true;
            }
            else {
                if ($scope.war.bases[baseNum-1].a.length == 0) {
                    // not called yet
                    open = true;
                }
                else if ($scope.war.bases[baseNum-1].a[$scope.war.bases[baseNum-1].a.length-1].s != null) {
                    // called, but attacks done
                    open = true;
                }
            }

            if (open) {

                // calculate when this call expires. this is based on a lot of factors, including the configured cleanup time allowed, free for all
                // time allowed, and whether the reservation time crosses the end of the war
                var expireDate = null;

                if (now.getTime() >= freeForAllDate.getTime()) {
                    // already passed the free for all time
                    expireDate = null;
                }

                else if (possibleExpireDate.getTime() >= warEnd) {
                    // possible expire date is already greater than war end
                    expireDate = warEnd;
                }
                else {
                    expireDate = possibleExpireDate;
                }

                var model =
                {
                    bIndex: baseNum -1,
                    assignment: {
                        u: userId,
                        i: ign,
                        c: new Date(),
                        e: expireDate,
                        s: null
                    }
                }

                warService.assignBase($scope.war._id, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.assignBase', message: 'Error assigning base' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was assigned base ' + baseNum + ' by ' + $scope.meta.ign, ign, 'target', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // nothing to do here
                            }
                        });
                    }
                });
            }
        });
    }

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
                    refreshInterface();
                    callback();
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

        $scope.basesByPlayer = [];

        angular.forEach($scope.war.team, function (tm) {
            var member = {
                b: tm.b,
                u: tm.u,
                i: tm.i,
                t: tm.t,
                a: []
            };
            angular.forEach($scope.war.bases, function (base) {
                var assignmentIndex = 0;
                angular.forEach(base.a, function (assignment) {
                    if (assignment.u == tm.u) {
                        var expires = 0;
                        if (assignment.e != null) {
                            var expireTime = new Date(assignment.e);
                            expires = expireTime.getTime();
                        }
                        assignment.expires = expires;
                        assignment.b = base.b;
                        assignment.ai = assignmentIndex; // needed for updating stars
                        member.a.push(assignment);
                    }
                    assignmentIndex++;
                });
            });
            $scope.basesByPlayer.push(member);
        });

        setCountdownTimers();
        //console.log($scope.basesByPlayer);
        var promise = $interval(setCountdownTimers, 30000);
        $scope.$on('$destroy', function() {
            $interval.cancel(promise);
        });
    }

    function setCountdownTimers() {
        var now = new Date();
        var openMembers = {};
        angular.forEach($scope.basesByPlayer, function (base) {
            angular.forEach(base.a, function (assignment) {
                if (assignment.expires > 0) {
                    var minutesLeft = parseInt((assignment.expires - now.getTime())/1000/60);
                    assignment.hours = parseInt(minutesLeft / 60);
                    assignment.minutes = parseInt(minutesLeft % 60);
                    if (minutesLeft < 0) {
                        //expired!
                        assignment.expires = -assignment.expires;
                    }
                }
            });
        });
    }

}]);
