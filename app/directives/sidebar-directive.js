'use strict';

angular.module('Clashtools.directives')
.directive('sidebar', ['$timeout', 'authService', 'sessionService', 'ctSocket',
function ($timeout, authService, sessionService, ctSocket) {
    return {
        restrict: 'A',
        templateUrl: '/views/partials/sidebar.html',
        link: function(scope, element, attrs) {
            sessionService.getUserMeta(authService.user.id, function (err, meta) {
                scope.meta = meta;
            });

            // subscribe to updates on user meta changes
            ctSocket.on('user:' + authService.user.id + ':meta', function (data) {
                sessionService.getUserMeta(authService.user.id, function (err, meta) {
                    scope.meta = meta;

                    // give it a second to refresh, make sure the upload finished
                    $timeout(function() {
                        scope.meta.avatar += '?ts=' + new Date().getTime();
                    }, 2000);

                });
            });
        }
    }
}]);
