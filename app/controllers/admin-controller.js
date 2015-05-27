'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminCtrl', ['$rootScope', '$scope', '$location', 'userService', 'authService', 'sessionService', 'errorService',
function ($rootScope, $scope, $location, userService, authService, sessionService, errorService) {

    $rootScope.title = "Clashtools - Admin";

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
    });

}]);