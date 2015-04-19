'use strict';

angular.module('Clashtools.directives')
.directive('topNav', ['moment', 'authService', 'sessionService', 'messagelogService',
function (moment, authService, sessionService, messagelogService) {
    return {
        restrict: 'A',
        templateUrl: '/views/partials/topNav.html',
        link: function(scope, element, attrs) {
            sessionService.getUserMeta(authService.user.id, function (err, meta) {
                scope.userName = meta.name;
            });

            scope.$watch('logUpdate', function() {
                messagelogService.get(authService.user.id, 10000, function (err, messages) {
                    scope.messageCount = messages.length;
                    scope.messages = messages.slice(0,5);
                    angular.forEach(scope.messages, function (message) {
                        message.created_at = new moment(message.created_at);
                    });
                });
            });
        }
    }
}]);
