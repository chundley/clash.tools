'use strict';

angular.module('Clashtools.directives')
.directive('topNav', ['$location', 'moment', 'authService', 'sessionService', 'messagelogService',
function ($location, moment, authService, sessionService, messagelogService) {
    return {
        restrict: 'A',
        templateUrl: '/views/partials/topNav.html',
        link: function(scope, element, attrs) {

            scope.search = function() {
                console.log(scope.searchTerms);
                $location.path('/search?q=' + scope.searchTerms);
            }

/*            sessionService.getUserMeta(authService.user.id, function (err, meta) {
                console.log(meta);
                scope.ign = meta.ign;
            });*/

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
