'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminHomeCtrl', ['$rootScope', '$scope', '$location', 'moment', 'userService', 'authService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $location, moment, userService, authService, sessionService, errorService, clanService) {

    $rootScope.title = "Clashtools - Admin";

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
        //runSearch('*');
    });

    $scope.searchLocal = function() {
        if ($scope.localSearchTerms.length > 0) {
            //$scope.query = $scope.localSearchTerms;
            runSearch($scope.localSearchTerms);

        }
        else {
            //$scope.query = '*';
            runSearch('');
        }
    }

    $scope.spoofLeader = function(clan) {
        var user = {
            id: clan.metrics.leader.id,
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
        if (query.length > 0) {
            clanService.adminAllClans(query, 10000, function (err, clans) {
                angular.forEach(clans, function (clan) {
                    clan.started = new moment(new Date(clan.created_at));
                });

                $scope.clans = clans;
            });
        }
        else {
            $scope.clans = [];
        }
    }

}]);