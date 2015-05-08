'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('WarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, warService) {

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

                    // load war once, then every 60 seconds to keep open targets up to date
                    loadWar(function(){});
                    var promiseWar = $interval(function() {
                        loadWar(function(){});
                    }, 20000);

                    $scope.$on('$destroy', function() {
                        $interval.cancel(promiseWar);
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
        $scope.$broadcast('timer-start');

        angular.forEach($scope.war.bases, function (base) {
            var maxStars = null;
            angular.forEach(base.a, function (assignment) {
                var expires = 0;
                if (assignment.e != null) {
                    var expireTime = new Date(assignment.e);
                    expires = expireTime.getTime();
                }
                if (assignment.s != null && assignment.s > maxStars) {
                    maxStars = assignment.s;
                }
                assignment.expires = expires;
            });
            base.maxStars = maxStars;
            base.isOpen = false;

            // determine if the base is open
            if ($scope.clan.war_config.overcalls) {
                // if overcalls are allowed we don't care if the base has already been reserved
                base.isOpen = true;
            }
            else if ($scope.warStarted && base.a.length == 0) {
                // war has started and this base is uncalled
                base.isOpen = true;
            }
            else if (now.getTime() >= freeForAllDate.getTime()) {
                // if we are in the free for all period, overcalls are allowed no matter what
                base.isOpen = true;
            }
            else if (!$scope.clan.war_config.overcalls && base.a.length > 0) {
                // determine if the current call has expired
                if (now.getTime() > base.a[base.a.length-1].e) {
                    base.isOpen = true;
                }
                // determine if the latest attack has been done
                if (base.a[base.a.length-1].s != null) {
                    base.isOpen = true;
                }
            }
        });


        // set countdown for targets, and set it to refresh every 30 seconds
        //if ($scope.playerTargets.length > 0) {
            setCountdownTimers();
            var promise = $interval(setCountdownTimers, 30000);
            $scope.$on('$destroy', function() {
                $interval.cancel(promise);
            });
        //}
        //findOpenTargets();
    }

    function setCountdownTimers() {
        var now = new Date();
        angular.forEach($scope.war.bases, function (base) {
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
