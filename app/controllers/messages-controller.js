'use strict';

/*
*   Controller for messages
*/

angular.module('Clashtools.controllers')
.controller('MessagesCtrl', ['$rootScope', '$scope', 'authService', 'messagelogService', 'errorService',
function ($rootScope, $scope, authService, messagelogService, errorService) {

    $rootScope.title = 'Siftrock - Messages';
    $scope.helpLink = 'http://www.siftrock.com/help/messages';

    loadMessages();

    $scope.dismiss = function(id) {
        messagelogService.dismiss(authService.user.id, id, function (err, message) {
            if (err) {
                err.stack_trace.unshift( { file: 'messages-controller.js', func: '$scope.dismiss', message: 'Error dismissing message' } );
                errorService.save(err, function() {});
            }
            else {
                loadMessages();
            }
        });
    }

    $scope.dismissAll = function(messages) {
        angular.forEach(messages, function (message) {
            messagelogService.dismiss(authService.user.id, message._id, function (err, message) {
                if (err) {
                    err.stack_trace.unshift( { file: 'messages-controller.js', func: '$scope.dismissAll', message: 'Error dismissing message' } );
                    errorService.save(err, function() {});
                }
                else {
                    loadMessages();
                }
            });
        });
    }

    function loadMessages() {
        messagelogService.get(authService.user.id, 1000, function (err, messages) {
            if (err) {
                err.stack_trace.unshift( { file: 'messages-controller.js', func: 'loadMessages', message: 'Error loading messages' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.messageCount = messages.length;
                if ($scope.messageCount == 0) {
                    $scope.nullState = true;
                }
                else {
                    $scope.nullState = false;
                    $scope.allMessages = messages.slice(0,25);
                    angular.forEach($scope.allMessages, function (message) {
                        message.created_at = new moment(message.created_at);
                    });
                }
            }
        });
    }
}]);
