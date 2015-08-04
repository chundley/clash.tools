'use strict';

angular.module('Clashtools.directives')
.directive('topNav', ['$location', '$interval', 'moment', 'authService', 'sessionService', 'emailMessageService', 'ctSocket',
function ($location, $interval, moment, authService, sessionService, emailMessageService, ctSocket) {
    return {
        restrict: 'A',
        templateUrl: '/views/partials/topNav.html',
        link: function(scope, element, attrs) {

/*            scope.search = function() {
                $location.path('/clans/' + scope.searchTerms).replace();
            }

            scope.mightSearch = function() {
                if (scope.searchTerms.length == 0) {
                    $location.path('/clans/*').replace();
                }
                else if (scope.searchTerms.length > 1) {
                    $location.path('/clans/' + scope.searchTerms).replace();
                }
            }*/

            sessionService.getUserMeta(authService.user.id, function (err, meta) {
                scope.ign = meta.ign;
                scope.clanName = meta.current_clan.name ? meta.current_clan.name : '';
                scope.clanId = meta.current_clan.clan_id ? meta.current_clan.clan_id : '';
            });

            // load email count initially
            emailMessageService.countNew(authService.user.id, function (err, data) {
                scope.newMailCount = data.count;
            });

            // then listen for socket.io updates
            ctSocket.on('email:' + authService.user.id + ':count', function (data) {
                scope.newMailCount = data.count;
            });

        }
    }
}]);
