'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('WarsCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'warService',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, warService) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'wars-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.clan = meta.current_clan;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' war history';

            warService.getHistory(meta.current_clan.clan_id, function (err, wars) {
                if (err) {
                    err.stack_trace.unshift( { file: 'wars-controller.js', func: 'init', message: 'Error getting war history' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.wins = 0;
                    $scope.losses = 0;
                    $scope.ties = 0;
                    angular.forEach(wars, function (war) {
                        var startDate = new Date(war.start);
                        startDate = new Date(startDate.getTime() + 24*60*60*1000);
                        war.ended = new moment(startDate);

                        if (war.result == 0) {
                            $scope.losses++;
                        }
                        else if (war.result == 1) {
                            $scope.wins++;
                        }
                        else {
                            $scope.ties++;
                        }
                    });

                    $scope.wars = wars;
                }
            });
        }
    });

    $scope.warDetail = function(warId) {
        $location.url('/war/summary/' + warId);
    }

}]);
