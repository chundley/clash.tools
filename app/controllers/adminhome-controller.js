'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminHomeCtrl', ['$rootScope', '$scope', '$location', 'userService', 'authService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $location, userService, authService, sessionService, errorService, clanService) {

    $rootScope.title = "Clashtools - Admin";

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
        runSearch('*');
    });

    $scope.searchLocal = function() {
        if ($scope.localSearchTerms.length > 0) {
            //$scope.query = $scope.localSearchTerms;
            runSearch($scope.localSearchTerms);

        }
        else {
            //$scope.query = '*';
            runSearch('*');
        }
    }

    $scope.spoofLeader = function(clan) {
        var user = {
            id: clan.metrics.leaderId,
            email_address: '',
            role: {
                bitMask: 16,
                title: 'leader'
            }
        };

        authService.spoofUser(user, function () {
            $location.url('/home').replace();
        });
    }

    function runSearch(query) {
        clanService.allClans(query, function (err, clans) {
            $scope.clans = clans;
        });
    }

}]);