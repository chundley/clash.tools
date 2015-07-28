'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('BanListCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', '$window', 'moment', 'authService', 'sessionService', 'errorService', 'messagelogService', 'userService', 'playerNotesService', 'banListService', 'utils',
function ($rootScope, $scope, $routeParams, $location, $modal, $window, moment, authService, sessionService, errorService, messagelogService, userService, playerNotesService, banListService, utils) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'banlist-controller.js', func: 'init', message: 'Error geting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            //loadBanList();
        }
    });

    $scope.unBan = function(player) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Remove "' + player.ign + '" from the ban list. Are you sure?',
            label: 'Un-ban reason',
            placeholder: 'Type a reason here',            
            yesBtn: 'Un-ban',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                // if they were un-banned, add the note to the standard set of notes and delete the ban
                banListService.delete(player.user_id, $scope.meta.current_clan.clan_id, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'banlist-controller.js', func: '$scope.unBan', message: 'Error deleting ban record when un-banning' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // only add a note if this player exists as part of the roster
                        if (player.user_id.length == 24) {
                            var model = {
                                user_id: player.user_id,
                                clan_id: $scope.meta.current_clan.clan_id,
                                note: {
                                    user_id: authService.user.id,
                                    ign: $scope.meta.ign,
                                    note: formData.note + ' (player was un-banned)'
                                }
                            };

                            playerNotesService.save(player.user_id, model, function (err, result) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'banlist-controller.js', func: '$scope.unBan', message: 'Error adding un-ban message to user' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    $rootScope.globalMessage = player.ign + ' was un-banned';
                                    loadBanList();
                                }
                            });
                        }
                        else {
                            $rootScope.globalMessage = player.ign + ' was un-banned';
                            loadBanList();                            
                        }

                        // Log this activity
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was un-banned by ' + $scope.meta.ign, player.ign, 'member', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.setBanned', message: 'Error saving un-ban message in the log' } );
                                errorService.save(err, function() {});
                            }
                        });                                               
                    }
                });
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/addNoteDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });


    }

    $scope.addBan = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {           
            yesBtn: 'Ban player',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                // add player to ban list
                var banModel = {
                    user_id: utils.createGUID(),
                    clan_id: $scope.meta.current_clan.clan_id,
                    ign: formData.ign,
                    player_tag: formData.tag,
                    note: {
                        user_id: authService.user.id,
                        ign: $scope.meta.ign,
                        note: formData.note
                    }
                };

                banListService.save($scope.meta.current_clan.clan_id, banModel, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'banlist-controller.js', func: '$scope.adBan', message: 'Error saving banned user' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = formData.ign + ' has been banned';
                        loadBanList();
                    }
                });

                // Log this activity
                messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was banned by ' + $scope.meta.ign, formData.ign, 'delete', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'banlist-controller.js', func: '$scope.setBanned', message: 'Error saving ban message in the log' } );
                        errorService.save(err, function() {});
                    }
                });                 
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/addBanPlayer.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    function loadBanList() {
        banListService.get($scope.meta.current_clan.clan_id, function (err, list) {
            if (err) {
                err.stack_trace.unshift( { file: 'banlist-controller.js', func: 'loadBanList', message: 'Error geting ban list' } );
                errorService.save(err, function() {});
            }
            else {
                angular.forEach(list, function (player) {
                    player.created_at = new moment(player.created_at); 
                });
                $scope.banList = list;
            }
        });
    }
}]);
