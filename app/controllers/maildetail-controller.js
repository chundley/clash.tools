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
            setCounts();
        }
    });

    $scope.deleteMessage = function() {
        emailMessageService.delete($scope.emailDetail._id, function (err, resp) {
            if (err) {
                err.stack_trace.unshift( { file: 'maildetail-controller.js', func: '$scope.deleteMessage', message: 'Error deleting message' } );
                errorService.save(err, function() {});
            }
            else {
                $location.path('/mail').search('folder', $scope.folder).replace();
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
            if (message._id == $scope.emailId) {
                $scope.emailDetail = message;
            }

            if (message.to_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.inbox++;
                }
            }
            if (message.from_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.sent++;
                }
            }
        });
    }

}]);
