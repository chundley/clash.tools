'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ChatCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, clanService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

/*    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.clan;
    });
*/

    $scope.tags = [
        {text: 'Tag 1'},
        {text: 'Tag 2'},
        {text: 'Blah'}
    ];

}]);
