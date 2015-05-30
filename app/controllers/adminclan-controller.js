'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminClanCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'moment', 'userService', 'authService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, moment, userService, authService, sessionService, errorService, clanService) {

    $rootScope.title = "Clashtools - Admin - Clan";

    $scope.clanId = $routeParams.id;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'adminclan-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
        }

    });

    clanService.adminAllData($scope.clanId, function (err, clan) {
        if (err) {
            err.stack_trace.unshift( { file: 'adminclan-controller.js', func: 'init', message: 'Error getting clan data' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.clan = clan;
            angular.forEach($scope.clan.members, function (member) {
                member.joined = new moment(member.current_clan.joined);
            });

            $scope.clan.clan.age = new moment($scope.clan.clan.created_at);
            console.log($scope.clan);
        }

    });


}]);