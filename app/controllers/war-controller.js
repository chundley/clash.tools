'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('WarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, warService) {

    $scope.warId = $routeParams.id;
    $scope.activeWar = false;
    $scope.numBases = 0;

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
                    }, 60000);

                    $scope.$on('$destroy', function() {
                        $interval.cancel(promiseWar);
                    });                                        
                }
            });
        }
    });

    $scope.numBases = function() {
        return $scope.numBases;
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
                    $scope.numBases = war.num_bases;
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
        var start = new Date($scope.war.start);
        if (start.getTime() <= now.getTime()) {
            // war has started, set the end time to +24 hours from start
            $scope.warStartTime = start.getTime() + 24*60*60*1000;
            $scope.warStarted = true;
        }   
        else {
            $scope.warStartTime = start.getTime(); 
            $scope.warStarted = false;
        }
        $scope.$broadcast('timer-start'); 

/*        $scope.playerTargets = [];
        angular.forEach($scope.war.bases, function (base) {
            angular.forEach(base.a, function (assignment) {
                if (assignment.u == authService.user.id) {
                    // if we've passed free for all time there is no expiration
                    var expires = 0;
                    if (assignment.e != null) {
                        var expireTime = new Date(assignment.e);
                        expires = expireTime.getTime();
                    }
                    $scope.playerTargets.push(
                        {
                            base_num: base.b,
                            stars: assignment.s,
                            expires: expires,
                            hours: 0,
                            minutes: 0
                        }
                    );
                }
            })
        });*/

        // set countdown for targets, and set it to refresh every 30 seconds 
/*        if ($scope.playerTargets.length > 0) {
            setCountdownTimers();
            var promise = $interval(setCountdownTimers, 30000);
            $scope.$on('$destroy', function() {
                $interval.cancel(promise);
            });
        }
        findOpenTargets();*/
    }

    function setCountdownTimers() {
/*        var now = new Date();
        angular.forEach($scope.playerTargets, function (target) {
            if (target.expires > 0) {
                var minutesLeft = parseInt((target.expires - now.getTime())/1000/60);
                target.hours = parseInt(minutesLeft / 60);
                target.minutes = parseInt(minutesLeft % 60);
            }
        });*/
    }

}]);
