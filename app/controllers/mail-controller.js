'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('MailCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', 'authService', 'sessionService', 'errorService', 'emailMessageService',
function ($rootScope, $scope, $routeParams, $location, $interval, authService, sessionService, errorService, emailMessageService) {

    $scope.folder = $location.search().folder ? $location.search().folder : 'inbox';
    $scope.counts = {
        inbox: 0,
        sent: 0,
        trash: 0
    };
    $scope.activeMessages = [];

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.current_clan;
    });

    // run once on UI load
    refreshMail();

    // and then every 60 seconds
    var promise = $interval(refreshMail, 30000);

    $scope.$on('$destroy', function() {
        $interval.cancel(promise);
    });


    $scope.changeFolder = function(folder) {
        $scope.folder = folder;
        setActiveMessages();
    }

    $scope.deleteMessage = function(message) {
        emailMessageService.delete(message._id, authService.user.id, function (err, resp) {
            if (err) {
                err.stack_trace.unshift( { file: 'mail-controller.js', func: '$scope.deleteMessage', message: 'Error deleting message' } );
                errorService.save(err, function() {});
            }
            else {
                angular.forEach($scope.allMessages, function (msg) {
                    if (msg._id == message._id) {
                        if ($scope.folder == 'sent') {
                            msg.from_user.deleted = true;
                        }
                        else {
                            angular.forEach(msg.to_users, function (user) {
                                if (user.user_id == authService.user.id) {
                                    user.deleted = true;
                                }
                            });
                        }
                    }
                });
                setCounts();
                setActiveMessages();
            }
        });
    }

    function refreshMail() {
        emailMessageService.get(authService.user.id, 20, function (err, mailMessages) {
            if (err) {
                err.stack_trace.unshift( { file: 'mail-controller.js', func: 'refreshMail', message: 'Error getting email messages' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.allMessages = mailMessages;
                setCounts();
                setActiveMessages();
            }
        });
    }

    function setCounts() {
        $scope.counts = {
            inbox: 0,
            sent: 0,
            trash: 0
        };

        angular.forEach($scope.allMessages, function (message) {
            angular.forEach(message.to_users, function (user) {
                if (user.user_id === authService.user.id) {
                    if (user.deleted) {
                        $scope.counts.trash++;
                    }
                    else {
                        $scope.counts.inbox++;
                    }
                }
            })

            if (message.from_user.user_id === authService.user.id) {
                if (message.from_user.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.sent++;
                }
            }
        });
    }

    function setActiveMessages() {
        $scope.activeMessages = [];
        angular.forEach($scope.allMessages, function (message) {
            message.created_at = new moment(message.created_at);
            if ($scope.folder == 'inbox') {
                angular.forEach(message.to_users, function (user) {
                    if (user.user_id === authService.user.id &&
                        !user.deleted) {
                        message.read = false;
                        if (user.read) {
                            message.read = true;
                        }
                        $scope.activeMessages.push(message);
                    }
                });
            }

            else if ($scope.folder == 'sent') {
                if (message.from_user.user_id === authService.user.id &&
                    !message.from_user.deleted) {
                    message.read = true;
                    var toUsers = '';
                    angular.forEach(message.to_users, function (user) {
                        toUsers += user.ign + ','
                    });
                    toUsers = toUsers.substring(0, toUsers.length-1);
                    message.toUsers = toUsers;
                    $scope.activeMessages.push(message);

                }
            }
            else {
                if (message.from_user.user_id == authService.user.id &&
                    message.from_user.deleted) {
                    $scope.activeMessages.push(message);
                }
                else {
                    angular.forEach(message.to_users, function (user) {
                        if (user.user_id === authService.user.id &&
                            user.deleted) {
                            message.read = false;
                            if (user.read) {
                                message.read = true;
                            }
                            $scope.activeMessages.push(message);
                        }
                    });
                }
            }
        });
    }
}]);
