'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ProfileCtrl', ['$rootScope', '$scope', '$interval', '$modal', '$window', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService', 'Upload', 'imageUploadService', 'trackService',
function ($rootScope, $scope, $interval, $modal, $window, moment, authService, cacheService, sessionService, errorService, userService, Upload, imageUploadService, trackService) {
    // initialize
    $rootScope.title = 'Profile - clash.tools';

    $scope.walls = [];
    for (var idx=0; idx<=250; idx++) {
        $scope.walls.push({count: idx});
    }

    userService.getById(authService.user.id, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'profile-controller.js', func: 'init', message: 'Error getting user' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.user = user;
            $scope.originalEmail = user.email_address;
            setCountdownTimers();

            // set countdown timers to refresh every three minutes
            var promise = $interval(setCountdownTimers, 180000);
            $scope.$on('$destroy', function() {
                $interval.cancel(promise);
            });
        }
    });

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
    });


    /*
    *   Special case for top form which has a $dirty error
    */
    $scope.saveTop = function() {
        saveUserInternal();
        $scope.nameForm.$setPristine();        
        $rootScope.globalMessage = 'Profile was saved.';
    }

    $scope.saveWithFeedback = function() {
        saveUserInternal();
        $rootScope.globalMessage = 'Profile was saved.';
    }

    $scope.saveUser = function() {
        saveUserInternal();
    }


    $scope.uploadAvatar = function(file) {
        if (file.length > 0) {
            imageUploadService.uploadAvatar(authService.user.id, file, function (err, result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'profile-controller.js', func: '$scope.uploadAvatar', message: 'Error saving user' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.user.profile.avatar = result.newFile;
                    saveUserInternal();
                    $scope.meta.avatar = result.newFile + '?' + new Date().getTime();
                    $scope.avatarError = null;
                    $rootScope.globalMessage = 'Your avatar has been changed - you should see it in the next few seconds.';
                    trackService.track('saved-avatar', { "file": result.newFile } );
                }
            });
        }

        if ($scope.badAvatar.length > 0) {
            $scope.avatarError = 'That file is not an image, or is too big. The file size limit is 128KB';
        }
    }

    $scope.upgradeHero = function(isBK) {
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
                if (isBK) {
                    $scope.user.profile.bkUpgrade = new Date(now.getTime() + ((formData.finishedDays*24*60 + formData.finishedHours*60)*60000));
                    trackService.track('upgraded-bk');
                }
                else {
                    $scope.user.profile.aqUpgrade = new Date(now.getTime() + ((formData.finishedDays*24*60 + formData.finishedHours*60)*60000));
                    trackService.track('upgraded-aq');
                }
                saveUserInternal();

                $rootScope.globalMessage = 'Hero upgrade status saved';
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/heroUpgradeDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.changeEmailStatus = function() {
        console.log($scope.nameForm);
        if ($scope.user.mail_settings.enabled) {
            // setting to true. if they have a bounce, let them know
            if ($scope.user.mail_settings.bounced) {
                $scope.user.mail_settings.enabled = false;

                var cssClass = 'center';
                if ($window.innerWidth < 500) {
                    cssClass = 'mobile';
                }

                $scope.modalOptions = {
                    title: 'Bad email address',
                    message: 'Clash.tools has attempted to send you email at your configured address and failed. Please update your email address to something valid.',
                    cssClass: cssClass
                };

                var modalInstance = $modal(
                    {
                        scope: $scope,
                        animation: 'am-fade-and-slide-top',
                        placement: 'center',
                        template: "/views/partials/notifyDialog.html",
                        show: false
                    }
                );

                modalInstance.$promise.then(function() {
                    modalInstance.show();
                });                
            }
        }
        else {
            $scope.user.mail_settings.enabled = true;
            var cssClass = 'center';
            if ($window.innerWidth < 500) {
                cssClass = 'mobile';
            }

            $scope.modalOptions = {
                title: 'Disable email?',
                message: 'Please confirm you want to stop receiving emails from clash.tools. You will no longer be sent any email from the app if you choose "Disable".',
                yesBtn: 'Disable',
                noBtn: 'Cancel',
                cssClass: cssClass,
                onYes: function() {
                    $scope.user.mail_settings.enabled = false;
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
    }

    $scope.wallDD = function() {
        var options = [];
        for (var idx=0; idx<=250; idx++) {
            options.push(idx);
        }
        return options;
    }

    function saveUserInternal() {
        // clear meta data in case the UI needs bits refreshed
        sessionService.clearUserMeta();

        if ($scope.user.email_address != $scope.originalEmail) {
            $scope.user.verified = false;
            $scope.user.mail_settings.bounced = false;
        }

        userService.update($scope.user._id, $scope.user, function (err, newUser) {
            if (err) {
                err.stack_trace.unshift( { file: 'profile-controller.js', func: '$scope.saveUser', message: 'Error saving user' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.user = newUser;
                setCountdownTimers();
            }
        });
    }

    function setCountdownTimers() {
        var now = new Date();

        var bkFinishTime = new Date($scope.user.profile.bkUpgrade);
        bkFinishTime = bkFinishTime.getTime();

        if (bkFinishTime > now.getTime()) {
            var hoursLeft = parseInt((bkFinishTime - now.getTime())/1000/60/60);
            $scope.bkDays = parseInt(hoursLeft / 24);
            $scope.bkHours = parseInt(hoursLeft % 24);
        }
        else {
            $scope.bkDays = 0;
            $scope.bkHours = 0;
        }

        var aqFinishTime = new Date($scope.user.profile.aqUpgrade);
        aqFinishTime = aqFinishTime.getTime();

        if (aqFinishTime > now.getTime()) {
            var hoursLeft = parseInt((aqFinishTime - now.getTime())/1000/60/60);
            $scope.aqDays = parseInt(hoursLeft / 24);
            $scope.aqHours = parseInt(hoursLeft % 24);
        }
        else {
            $scope.aqDays = 0;
            $scope.aqHours = 0;
        }
    }

}]);