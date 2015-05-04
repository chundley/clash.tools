'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('WarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, clanService, warService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var warId = $routeParams.id;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }   
        else {     
            $scope.meta = meta;

            if (warId !== 'new') {
                warService.getById(warId, function (err, war) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting user meta' } );
                        errorService.save(err, function() {});
                    }   
                    else {                      
                        $scope.war = war;
                        $rootScope.title = 'Clan war vs: ' + war.opponent_name + ' - clash.tools';
                    }
                });
            }
            else {
                $scope.war = {
                    clan_id: $scope.meta.current_clan.clan_id,
                    active: true,
                    opponent_name: '',
                    opponent_tag: '',
                    player_count: 10,
                    ends: new Date(),
                    bases: {},
                    created_at: new Date(),
                    created_by: authService.user.id
                };
                $rootScope.title = 'New war - clash.tools';
            }            
        }
    });






/*
    $scope.saveNewClan = function() {
        clanService.save($scope.clan, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan' } );
                errorService.save(err, function() {});
            }
            else if (!result) {
                // clan tag already exists
                $scope.errorMsg = 'A clan with that tag already exists';
            }
            else {
                // Log this activity
                messagelogService.save(result._id, 'Clan "' + $scope.clan.name + '" created by [ign]', $scope.ign, 'special', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan message in the log' } );
                        errorService.save(err, function() {});
                    }
                });

                // In every case with a new clan, the creator becomes the leader. Need to reset role for UI permissions. The back-end
                // takes care of changing the values in the database
                var newUser = authService.user;
                newUser.role = { bitMask: 16, title: 'leader' };
                authService.changeUser(newUser, function () {
                    sessionService.clearUserMeta(); // clear session data so clan gets reset in user meta data
                    $location.url('/clan/' + result._id).replace();
                });
            }
        });
    }

    $scope.saveClan = function() {
        clanService.save($scope.clan, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveClan', message: 'Error saving clan' } );
                errorService.save(err, function() {});
            }
            else {
                // Log this activity
                messagelogService.save(result._id, 'Clan settings changed by [ign]', $scope.ign, 'special', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveClan', message: 'Error saving new clan message in the log' } );
                        errorService.save(err, function() {});
                    }
                });
            }
        });
    }*/

}]);
