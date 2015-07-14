'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClanCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, clanService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var clanId = $routeParams.id;

    if (clanId !== 'new') {
        $scope.newClan = false;

        clanService.getById(clanId, function (err, clan) {
            $scope.clan = clan;
            $rootScope.title = 'Clan settings: ' + clan.name + ' - clash.tools';
        });
    }
    else {
        $scope.newClan = true;
        $scope.clan = {
            meta: {},
            war_config: {
                first_assignment: 'leader',
                cleanup_assignment: 'all',
                first_attack_time: 12,
                cleanup_attack_time: 4,
                free_for_all_time: 2,
                overcalls: false
            },
            created_by: authService.user.id
        };
        $rootScope.title = 'New clan - clash.tools';
    }

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

                $rootScope.globalMessage = 'Clan "' + $scope.clan.name + '" created successfully.';
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

    $scope.savePublicInformation = function() {
        saveClanInternal(function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.savePublicInformation', message: 'Error saving public information' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.publicInformationForm.$setPristine();
                $rootScope.globalMessage = 'Public clan information saved.';
            }
        });
    }

    $scope.saveWarSettings = function() {
        saveClanInternal(function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveWarSettings', message: 'Error saving war settings' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.warSettingsForm.$setPristine();
                $rootScope.globalMessage = 'Clan war settings saved.'
            }
        });
    }

    function saveClanInternal(callback) {
        clanService.save($scope.clan, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: 'saveClanInternal', message: 'Error saving clan' } );
                callback(err);
                //errorService.save(err, function() {});
            }
            else {
                // Log this activity
                messagelogService.save(result._id, 'Clan settings changed by [ign]', $scope.ign, 'special', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: 'saveClanInternal', message: 'Error saving new clan message in the log' } );
                        errorService.save(err, function() {});
                    }
                });

                callback(null);
            }
        });
    }

}]);
