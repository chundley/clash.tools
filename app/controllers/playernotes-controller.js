'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('PlayerNotesCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', '$window', 'moment', 'authService', 'sessionService', 'errorService', 'messagelogService', 'userService', 'playerNotesService',
function ($rootScope, $scope, $routeParams, $location, $modal, $window, moment, authService, sessionService, errorService, messagelogService, userService, playerNotesService) {

    $scope.userId = $routeParams.id;
    $scope.baseNum = $routeParams.baseNum;

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
            title: 'Add note to ' + $scope.user.ign,
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
                $scope.war.bases[$scope.baseNum-1].n.n.splice(noteIndex, 1);
                warService.deleteBaseNote($scope.war._id, $scope.baseNum, note, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.deleteNote', message: 'Error deleting base note' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] deleted ' + note.i + '\'s note from base #' + $scope.baseNum, $scope.meta.ign, 'note', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.deleteNote', message: 'Error saving note message in the log' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // nothing to do here
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
                template: "/views/partials/confirmDialog.html",
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
