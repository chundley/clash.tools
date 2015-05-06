'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('WarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, warService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var warId = $routeParams.id;
    $scope.activeWar = false;

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
                    warService.getById(warId, function (err, war) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting user meta' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            $scope.war = war;
                            if (war.active) {
                                $scope.activeWar = true;

                                // start the countdown timer
                                var start = new Date(war.start);
                                $scope.warStartTime = start.getTime();
                                $scope.$broadcast('timer-start');
                            }
                            $rootScope.title = 'Clan war vs: ' + war.opponent_name + ' - clash.tools';
                        }
                    });
                }
            });

            clanService.getById($scope.meta.current_clan.clan_id, function (err, clan) {
                if (err) {
                    err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting clan' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.clan = clan;
                }
            });
        }
    });
/*
    $scope.setStartTime = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }
        
        $scope.modalOptions = {
            yesBtn: 'Set',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                var now = new Date();
                $scope.war.start = new Date(now.getTime() + ((formData.startsHours*60 + formData.startsMinutes)*60000));
                $scope.warStartTime = $scope.war.start.getTime();
                $scope.$broadcast('timer-start');

                // need to re-set any assignment expirations
                angular.forEach($scope.war.bases, function (base) {
                    angular.forEach(base.assignments, function (assignment) {
                        assignment.expires = new Date($scope.war.start.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
                    });
                });          
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/warStartDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });        
    }*/

    $scope.numBases = function() {
        return new Array($scope.war.player_count);
    }

    $scope.assignBase = function(baseNum, userId) {
        var startTime = new Date($scope.war.start);
        var expires = new Date(startTime.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
        for (var idx=0; idx<$scope.members.length; idx++) {
            if ($scope.members[idx]._id == userId) {
                $scope.war.bases[baseNum].a[0] = {
                    u: $scope.members[idx]._id,
                    i: $scope.members[idx].ign,
                    c: new Date(),
                    e: expires,
                    s: null,
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
        warService.save($scope.war, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'saveWarInternal', message: 'Error saving war' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.war = war;
            }
        });
    }

}]);
