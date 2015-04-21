'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClanCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', 'authService', 'cacheService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, $modal, authService, cacheService, sessionService, errorService, clanService) {
    // initialize
    $rootScope.title = 'New clan - clash.tools';

    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.nullState = false;

    var clanId = $routeParams.id;

    if (clanId !== 'new') {

    }

/*    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.clan;
    });
*/


    $scope.saveNewClan = function() {
        $scope.clan.created_by = authService.user.id;

        clanService.save($scope.clan, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan' } );
                errorService.save(err, function() {});
            }
            else if (!result) {
                // clan tag already exists
                $scope.errorMsg = 'A clan with that tag already exists';
            }
            else {
                $location.url('/clan/' + result._id).replace();
            }
        });
    }


    /*
    *   Saves the user session when it changes
    */
    function saveUserSession() {
        $scope.userSession.dashboard_filters.last_changed = new Date();
        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, session) {
            if (err) {
                err.stack_trace.unshift( { file: 'dashboard-controller.js', func: '$scope.setPerPage', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
        });
    }

}]);