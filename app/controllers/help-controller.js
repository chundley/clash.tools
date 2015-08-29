'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('HelpCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService',
function ($rootScope, $scope, $routeParams, $location, authService) {
    // initialize
    $rootScope.title = 'Help - clash.tools';

    //$scope.helpId = $routeParams.id;

    $scope.helpIndex = 0;

    $scope.helpContent = [
        {
            path: 'links',
            title: 'Useful Links',
            order: 50,
            template: '/views/help/links.html'
        },
        {
            path: 'faq',
            title: 'General FAQ',
            order: 100,
            template: '/views/help/general-faq.html'
        },
        {
            path: 'leaders',
            title: 'Leader FAQ',
            order: 105,
            template: '/views/help/leader-faq.html'
        },
        {
            path: 'war-setup',
            title: 'War Setup',
            order: 150,
            template: '/views/help/warSetup.html'
        },
        {
            path: 'av',
            title: 'Attack Value',
            order: 200,
            template: '/views/help/av.html'
        }
    ];

    for (var idx=0; idx< $scope.helpContent.length; idx++) {
        if ($scope.helpContent[idx].path == $routeParams.id) {
            $scope.helpIndex = idx;
        }
    }

    $scope.loggedIn = false;
    if (authService.isLoggedIn()) {
        $scope.loggedIn = true;
    }
    else {
    }

}]);