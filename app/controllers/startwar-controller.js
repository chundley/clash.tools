'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('StartWarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, clanService, warService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var warId = $routeParams.id;

    $scope.newWar = true;

    // set these to ensure form validation on load
    $scope.hours = 0;
    $scope.minutes = 0;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;

            clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {
                $scope.members = members;
                if (err) {
                    err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting clan members' } );
                    errorService.save(err, function() {});
                }
                else {
                    if (warId !== 'new') {
                        warService.getById(warId, function (err, war) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting user meta' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                $scope.war = war;
                                $scope.newWar = false;

                                // start the countdown timer to show it's working
                                var start = new Date(war.start);
                                $scope.warStartTime = start.getTime();
                                $scope.$broadcast('timer-start');
                                $rootScope.title = 'Clan war vs: ' + war.opponent_name + ' - clash.tools';
                            }
                        });
                    }
                    else {
                        $scope.newWar = true;
                        $scope.war = {
                            clan_id: $scope.meta.current_clan.clan_id,
                            active: true,
                            visible: false,
                            opponent_name: '',
                            opponent_tag: '',
                            player_count: 30,
                            start: new Date(),
                            bases: {},
                            team: {},
                            created_at: new Date(),
                            created_by: authService.user.id
                        };

                        for (var b=0; b<50; b++) {
                            $scope.war.bases[b+1] = {
                                th: 1,
                                assignments: []
                            };

                            $scope.war.team[b+1] = {
                                th: 1,
                                user_id: null,
                                ign: ''
                            };
                        }
                        $rootScope.title = 'New war - clash.tools';
                    }
                }
            });
        }
    });

    $scope.$watch($scope.hours, function (newVal, oldVal) {
        console.log(oldVal);
        console.log(newVal);
    });

    $scope.numBases = function() {
        return new Array($scope.war.player_count);
    }

    $scope.assignBase = function(baseNum, userId) {
        for (var idx=0; idx<$scope.members.length; idx++) {
            if ($scope.members[idx]._id == userId) {
                $scope.war.bases[baseNum].assignments[0] = {
                    user_id: $scope.members[idx]._id,
                    ign: $scope.members[idx].ign,
                    created_at: new Date(),
                    expires: new Date()
                };
                break;
            }
        }
        saveWarInternal();
    }

    $scope.saveWar = function() {
        saveWarInternal();
    }

    /*
    *   Disables the timer when editing war start
    */
    $scope.stopTimer = function() {
        $scope.$broadcast('timer-stop');
    }

    function saveWarInternal() {
        $scope.$broadcast('timer-stop');
        var now = new Date();
        $scope.war.start = new Date(now.getTime() + (($scope.hours*60 + $scope.minutes)*60000));
        $scope.warStartTime = $scope.war.start.getTime();
        warService.save($scope.war, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'saveWarInternal', message: 'Error saving war' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.war = war;
                if ($scope.newWar) {
                    $location.url('/startwar/' + war._id).replace();
                }
                else {
                    $scope.$broadcast('timer-start');
                }
            }
        });
    }

}]);
