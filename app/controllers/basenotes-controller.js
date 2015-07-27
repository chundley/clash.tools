'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('BaseNotesCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', '$window', 'moment', 'authService', 'sessionService', 'errorService', 'messagelogService', 'warService', 'imageUploadService', 'ctSocket',
function ($rootScope, $scope, $routeParams, $location, $modal, $window, moment, authService, sessionService, errorService, messagelogService, warService, imageUploadService, ctSocket) {

    $scope.warId = $routeParams.id;
    $scope.baseNum = $routeParams.baseNum;
    $scope.uploading = false;
    $scope.uploadingNoteImage = false;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;

        // load war
        loadWar(function(){
            if ($scope.war) {
                $rootScope.title = 'Base notes - war vs. ' + $scope.war.opponent_name + ' - clash.tools';
                // and after that any time a change is broadcast by socket.io
                ctSocket.on('war:' + $scope.war._id + ':change', function (data) {
                    loadWar(function(){});
                });
            }
        });
    });

    $scope.uploadBaseImg = function(file) {
        if (file.length > 0) {
            $scope.uploading = true;
            imageUploadService.upload($scope.war.clan_id, file, function (err, result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.uploadBaseImg', message: 'Error uploading base image' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.uploading = false;
                    $scope.war.bases[$scope.baseNum-1].n.img = result.newFile;
                    var model = { fileName: result.newFile };
                    warService.saveBaseImage($scope.war._id, $scope.baseNum, model, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.uploadBaseImg', message: 'Error saving base image url' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            messagelogService.save($scope.meta.current_clan.clan_id, '[ign] added image to base #' + $scope.baseNum, $scope.meta.ign, 'note', function (err, msg) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.uploadBaseImg', message: 'Error saving note message in the log' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    // nothing to do here
                                }
                            });                            
                        }
                    });
                }
            });
        }
    }

    $scope.deleteImage = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Delete base image',
            message: 'Please confirm you want to delete the base image for base:' + $scope.baseNum,
            yesBtn: 'Delete',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                $scope.war.bases[$scope.baseNum-1].n.img = null;
                var model = { fileName: null };
                warService.saveBaseImage($scope.war._id, $scope.baseNum, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.deleteImage', message: 'Error deleting base image url' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] deleted image from base #' + $scope.baseNum, $scope.meta.ign, 'note', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.deleteImage', message: 'Error saving note message in the log' } );
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

    $scope.addNote = function(type) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            title: 'Add note to base # ' + $scope.baseNum,
            cssClass: cssClass,
            baseNum: $scope.baseNum,
            formData: {},
            onYes: function(formData) {
                var model = {
                    u: authService.user.id,
                    i: $scope.meta.ign,
                    type: 'text',
                    content: formData.note,
                    created_at: new Date()
                };

                warService.saveBaseNote($scope.war._id, $scope.baseNum, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.addNote', message: 'Error adding a note to a base' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] added a note to base #' + $scope.baseNum, $scope.meta.ign, 'note', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.addNote', message: 'Error saving note message in the log' } );
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
                template: "/views/partials/addNoteDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.addImageNote = function(file) {
        if (file.length > 0) {
            $scope.uploadingNoteImage = true;
            imageUploadService.upload($scope.war.clan_id, file, function (err, result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.uploadBaseImg', message: 'Error uploading base image' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.uploadingNoteImage = false;
                    var model = {
                        u: authService.user.id,
                        i: $scope.meta.ign,
                        type: 'image',
                        content: result.newFile,
                        created_at: new Date()
                    }; 

                    warService.saveBaseNote($scope.war._id, $scope.baseNum, model, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.addImageNote', message: 'Error adding a note to a base' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            messagelogService.save($scope.meta.current_clan.clan_id, '[ign] added a note to base #' + $scope.baseNum, $scope.meta.ign, 'note', function (err, msg) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'basenotes-controller.js', func: '$scope.addImageNote', message: 'Error saving note message in the log' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    // nothing to do here
                                }
                            });                            
                        }
                    });
                }
            });
        }
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
                    if (!$scope.war.bases[$scope.baseNum-1].n) {
                        $scope.war.bases[$scope.baseNum-1].n = {
                            img: null,
                            n: []
                        };
                    }
                    else {
                        if ($scope.war.bases[$scope.baseNum-1].n.n && $scope.war.bases[$scope.baseNum-1].n.n.length > 0) {
                            angular.forEach($scope.war.bases[$scope.baseNum-1].n.n, function (note) {
                                note.created_at = new moment(note.created_at);
                            });
                        }
                    }
                    callback();
                }
                else {
                    callback();
                }
            }
        });
    }

}]);
