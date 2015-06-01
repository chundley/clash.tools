'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('HelpCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService',
function ($rootScope, $scope, $routeParams, $location, authService) {
    // initialize
    $rootScope.title = 'Help - clash.tools';

    $scope.helpId = $routeParams.id;
    $scope.helpTemplate = '/views/help/av.html';
    console.log($scope.helpTemplate);

    $scope.loggedIn = false;
    if (authService.isLoggedIn()) {
        $scope.loggedIn = true;
    }
    else {
    }

}]);