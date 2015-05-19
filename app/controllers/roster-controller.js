'use strict';

/*
*   Controller for clan roster page
*/

angular.module('Clashtools.controllers')
.controller('RosterCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'userService', 'CLAN_EMAILS',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, userService, CLAN_EMAILS) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'members-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $rootScope.title = meta.current_clan.name + ' clan roster';
            clanService.getRoster($scope.meta.current_clan.clan_id, function (err, roster) {
                if (err) {
                    err.stack_trace.unshift( { file: 'roster-controller.js', func: 'init', message: 'Error getting clan members' } );
                    errorService.save(err, function() {});
                }
                else {
/*                    angular.forEach(members, function (member) {
                        member.joined = new moment(member.current_clan.joined);
                    });*/
                    $scope.roster = roster;
                }
            });
        }
    });



}]);
