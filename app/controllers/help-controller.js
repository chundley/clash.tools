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

    $scope.helpContent = {
        'av': {
            path: 'av',
            title: 'Attack Value',
            template: '/views/help/av.html'
        }
    }

    $scope.loggedIn = false;
    if (authService.isLoggedIn()) {
        $scope.loggedIn = true;
    }
    else {
    }

}]);