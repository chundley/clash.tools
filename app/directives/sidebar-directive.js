'use strict';

angular.module('Clashtools.directives')
.directive('sidebar', ['moment', 'authService', 'sessionService', 'messagelogService',
function (moment, authService, sessionService, messagelogService) {
    return {
        restrict: 'A',
        templateUrl: '/views/partials/sidebar.html',
        link: function(scope, element, attrs) {
            sessionService.getUserMeta(authService.user.id, function (err, meta) {
                scope.ign = meta.ign;
                scope.clanName = meta.clan ? meta.clan.name : '';
            });

/*            scope.$watch('logUpdate', function() {
                messagelogService.get(authService.user.id, 10000, function (err, messages) {
                    scope.messageCount = messages.length;
                    scope.messages = messages.slice(0,5);
                    angular.forEach(scope.messages, function (message) {
                        message.created_at = new moment(message.created_at);
                    });
                });
            });*/
        }
    }
}]);
