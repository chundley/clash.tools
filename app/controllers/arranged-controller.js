'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'arrangedWarService',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, arrangedWarService) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'arranged-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' arranged wars';

            arrangedWarService.getByClanId(meta.current_clan.clan_id, function (err, wars) {
                if (err) {
                    err.stack_trace.unshift( { file: 'arranged-controller.js', func: 'init', message: 'Error getting arranged wars' } );
                    errorService.save(err, function() {});
                }
                else {
                    angular.forEach(wars, function (war) {
                        war.created_at = new moment(war.created_at);
                        if (war.clan_1.clan_id == $scope.meta.current_clan.clan_id) {
                            war.opp = war.clan_2;
                        }
                        else {
                            war.opp = war.clan_1;
                        }
                    });

                    $scope.wars = wars;
                    console.log(wars);
                }
            });
        }
    });

    $scope.warDetail = function(warId) {
        $location.url('/war/summary/' + warId);
    }

}]);
