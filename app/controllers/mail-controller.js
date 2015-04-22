'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('MailCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'emailMessageService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, emailMessageService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.folder = 'inbox';
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

    emailMessageService.get(authService.user.id, 20, function (err, mailMessages) {
        if (err) {
            err.stack_trace.unshift( { file: 'mail-controller.js', func: 'init', message: 'Error saving getting email messages' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.allMessages = mailMessages;
            setCounts();
            setActiveMessages();
        }
    });

    $scope.changeFolder = function(folder) {
        $scope.folder = folder;
        setActiveMessages();
    }

    function setCounts() {
        angular.forEach($scope.allMessages, function (message) {
            if (message.to_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.deleted++;
                }
                else {
                    $scope.counts.inbox++;
                }
            }
            if (message.from_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.deleted++;
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
                if (message.to_user.user_id === authService.user.id &&
                    !message.deleted) {
                    $scope.activeMessages.push(message);
                }
            }

            else if ($scope.folder == 'sent') {
                if (message.from_user.user_id === authService.user.id &&
                    !message.deleted) {
                    $scope.activeMessages.push(message);
                }
            }
            else {
                if (message.deleted) {
                    $scope.activeMessages.push(message);
                }
            }
        });
    }
}]);
