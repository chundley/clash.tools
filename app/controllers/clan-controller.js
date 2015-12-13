'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClanCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, clanService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var clanId = $routeParams.id;

    $scope.newTagColor = '#cccccc';
    $scope.tagColors = [
        '#de3e3a', '#de863a', '#28992f', '#248286', '#b42f78', '#bcae31', '#5a3197', '#305892', '#754c24', '#00aef0'
    ];

    if (clanId !== 'new') {
        $scope.newClan = false;

        clanService.getById(clanId, function (err, clan) {
            $scope.clan = clan;
            $rootScope.title = 'Clan settings: ' + clan.name + ' - clash.tools';
            $scope.newTagValid = false;
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
            base_tags: [
                {
                    name: 'Reserved',
                    color: $scope.tagColors[0]
                }
            ],
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

    $scope.setNewTagColor = function(color) {
        $scope.newTagColor = color;
        validateTagForm();
    }

    $scope.tagNameChange = function() {
        validateTagForm();
    }

    $scope.addTag = function() {
        $scope.clan.base_tags.push({
            color: $scope.newTagColor,
            name: $scope.newTagName
        });

        $scope.clan.base_tags.sort(function (a, b) {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
            }
            else {
                return -1;
            }
        });

        $scope.newTagColor = '#cccccc';
        $scope.newTagName = '';
        saveClanInternal(function(){});
        validateTagForm();
    }

    $scope.deleteTag = function(index) {
        $scope.clan.base_tags.splice(index, 1);
        saveClanInternal(function(){});
    }

    function validateTagForm() {
        $scope.newTagValid = true;
        if ($scope.newTagColor == '#cccccc') {
            $scope.newTagValid = false;
        }
        if (!$scope.newTagName || $scope.newTagName.length == 0) {
            $scope.newTagValid = false;
        }
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
