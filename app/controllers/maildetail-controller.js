'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('MailDetailCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'emailMessageService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, emailMessageService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.folder = $location.search().folder ? $location.search().folder : 'inbox';
    $scope.emailId = $routeParams.id;
    $scope.counts = {
        inbox: 0,
        sent: 0,
        trash: 0
    };

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.current_clan;
    });

    // still need to do this unfortunately for folder counts
    emailMessageService.get(authService.user.id, 20, function (err, mailMessages) {
        if (err) {
            err.stack_trace.unshift( { file: 'mail-maildetail.js', func: 'init', message: 'Error getting email messages' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.allMessages = mailMessages;
            setState();
        }
    });

    $scope.deleteMessage = function() {
        emailMessageService.delete($scope.emailDetail._id, authService.user.id, function (err, resp) {
            if (err) {
                err.stack_trace.unshift( { file: 'maildetail-controller.js', func: '$scope.deleteMessage', message: 'Error deleting message' } );
                errorService.save(err, function() {});
            }
            else {
                $location.path('/mail').search('folder', $scope.folder).replace();
            }
        });
    }

    function setState() {
        $scope.counts = {
            inbox: 0,
            sent: 0,
            trash: 0
        };

        $scope.toUsers = '';

        angular.forEach($scope.allMessages, function (message) {
            var msgDetail = false;
            if (message._id == $scope.emailId) {
                $scope.emailDetail = message;
                msgDetail = true;
            }
            angular.forEach(message.to_users, function (user) {
                if (user.user_id === authService.user.id) {
                    if (user.deleted) {
                        $scope.counts.trash++;
                    }
                    else {
                        $scope.counts.inbox++;
                    }
                }

                // need to create the toUsers output
                if (msgDetail) {
                    $scope.toUsers += user.ign + ', ';
                }
            })

            if (message.from_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.sent++;
                }
            }
        });

        // mark the email read
        if ($scope.emailDetail) {
            emailMessageService.setRead($scope.emailDetail._id, authService.user.id, function (err, result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'maildetail-controller.js', func: 'setState', message: 'Error setting message to read' } );
                    errorService.save(err, function() {});
                }
            });
        }

        $scope.toUsers = $scope.toUsers.substring(0, $scope.toUsers.length-2);
    }

}]);
