'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('PlayerNotesCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', '$window', 'moment', 'authService', 'sessionService', 'errorService', 'messagelogService', 'userService', 'playerNotesService', 'banListService',
function ($rootScope, $scope, $routeParams, $location, $modal, $window, moment, authService, sessionService, errorService, messagelogService, userService, playerNotesService, banListService) {

    $scope.userId = $routeParams.id;
    

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'playernotes-controller.js', func: 'init', message: 'Error geting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            userService.getByIdLimited($scope.userId, function (err, user) {
                if (err) {
                    err.stack_trace.unshift( { file: 'playernotes-controller.js', func: 'init', message: 'Error geting user details' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.user = user;
                    loadNotes();

                    banListService.getByUserId($scope.user._id, $scope.meta.current_clan.clan_id, function (err, record) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'playernotes-controller.js', func: 'init', message: 'Error geting ban record' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            if (record == 'null') {
                                $scope.banned = false;
                            }
                            else {
                                $scope.banned = true;
                            }
                        }
                    });
                }
            });
        }
    });


    $scope.addNote = function(type) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            title: 'Add note to "' + $scope.user.ign + '"',
            label: 'Note',
            placeholder: 'Type your note here',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                var model = {
                    user_id: $scope.user._id,
                    clan_id: $scope.meta.current_clan.clan_id,
                    note: {
                        user_id: authService.user.id,
                        ign: $scope.meta.ign,
                        note: formData.note
                    }
                };

                playerNotesService.save($scope.user._id, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.addNote', message: 'Error adding a note to a user' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = 'Note added for ' + $scope.user.ign;
                        loadNotes();
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

    $scope.deleteNote = function(note, noteIndex) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Delete note',
            message: 'Please confirm you want to delete this note',
            yesBtn: 'Delete',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                playerNotesService.delete($scope.meta.current_clan.clan_id, note._id, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.deleteNote', message: 'Error deleting player note' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = 'Note deleted';
                        loadNotes();
                    }
                });
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/confirmDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.setBanned = function() {
        var msg = "Are you sure you want to ban \"" + $scope.user.ign + "\"?";
        var yesBtn = "Ban";
        var label = 'Ban reason';
        if ($scope.banned) {
            // make sure we want to ban this person
            msg = "Un-ban \"" + $scope.user.ign + "\". Are you sure?";
            yesBtn = "Un-ban";
            label = 'Un-ban reason';
        }

        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: msg,
            label: label,
            placeholder: 'Type a reason here',            
            yesBtn: yesBtn,
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                if ($scope.banned) {
                    // if they were un-banned, add the note to the standard set of notes and delete the ban
                    banListService.delete($scope.user._id, $scope.meta.current_clan.clan_id, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.setBanned', message: 'Error deleting ban record when un-banning' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            var model = {
                                user_id: $scope.user._id,
                                clan_id: $scope.meta.current_clan.clan_id,
                                note: {
                                    user_id: authService.user.id,
                                    ign: $scope.meta.ign,
                                    note: formData.note + ' (player was un-banned)'
                                }
                            };

                            playerNotesService.save($scope.user._id, model, function (err, result) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.setBanned', message: 'Error adding un-ban message to user' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    $rootScope.globalMessage = $scope.user.ign + ' was un-banned';
                                    $scope.banned = !$scope.banned;
                                    loadNotes();
                                }
                            });                            
                        }
                    });
                }
                else {
                    // player was banned - save the ban message and ban status
                    var banModel = {
                        user_id: $scope.user._id,
                        clan_id: $scope.meta.current_clan.clan_id,
                        ign: $scope.user.ign,
                        player_tag: $scope.user.player_tag,
                        note: {
                            user_id: authService.user.id,
                            ign: $scope.meta.ign,
                            note: formData.note
                        }
                    };

                    banListService.save($scope.meta.current_clan.clan_id, banModel, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.setBanned', message: 'Error saving banned user' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            var noteModel = {
                                user_id: $scope.user._id,
                                clan_id: $scope.meta.current_clan.clan_id,
                                note: {
                                    user_id: authService.user.id,
                                    ign: $scope.meta.ign,
                                    note: formData.note + ' (player was banned)'
                                }
                            };

                            playerNotesService.save($scope.user._id, noteModel, function (err, result) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'playernotes-controller.js', func: '$scope.setBanned', message: 'Error adding un-ban message to user' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    $rootScope.globalMessage = $scope.user.ign + ' has been banned';
                                    $scope.banned = !$scope.banned;
                                    loadNotes();
                                }
                            });
                        }
                    });                    
                }
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

    function loadNotes() {
        playerNotesService.get($scope.user._id, $scope.meta.current_clan.clan_id, function (err, notes) {
            if (err) {
                err.stack_trace.unshift( { file: 'playernotes-controller.js', func: 'loadNotes', message: 'Error geting player notes' } );
                errorService.save(err, function() {});
            }
            else {
                angular.forEach(notes, function (note) {
                    note.created_at = new moment(note.created_at);
                });
                $scope.notes = notes;
            }
        });
    }

}]);
