'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('BaseNotesCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', '$window', 'authService', 'sessionService', 'errorService', 'messagelogService', 'warService', 'imageUploadService', 'ctSocket',
function ($rootScope, $scope, $routeParams, $location, $modal, $window, authService, sessionService, errorService, messagelogService, warService, imageUploadService, ctSocket) {

    $scope.warId = $routeParams.id;
    $scope.baseNum = $routeParams.baseNum;
    $scope.uploading = false;

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
                    callback();
                }
                else {
                    callback();
                }
            }
        });
    }

}]);
