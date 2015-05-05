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
                            created_at: new Date(),
                            created_by: authService.user.id
                        };

                        for (var b=0; b<50; b++) {
                            $scope.war.bases[b+1] = {
                                th: 0,
                                assignments: []
                            };
                        }
                        $rootScope.title = 'New war - clash.tools';
                        console.log($scope.war);
                    }
                }
            });
        }
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

    function saveWarInternal() {
        var now = new Date();
        $scope.war.start = new Date(now.getTime() + (($scope.hours*60 + $scope.minutes)*60000));
        $scope.warStartTime = $scope.war.start.getTime();
/*        $scope.warStartTime = $scope.war.start.getTime();

        $scope.$broadcast('timer-start');*/
        warService.save($scope.war, function (err, war) {
            if (err) {
                console.log(err);
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'saveWarInternal', message: 'Error saving war' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.war = war;
                if ($scope.newWar) {
                    $location.url('/startwar/' + war._id).replace();
                }
                else {
                    // start the timer back up after saving
                    $scope.$broadcast('timer-start');
                }
            }
        });
    }

    /*
    *   Disables the timer when editing war start
    */
    $scope.stopTimer = function() {
        $scope.$broadcast('timer-stop');
    }

}]);
