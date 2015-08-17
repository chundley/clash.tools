'use strict';

/*
*   Controller for the admin/bounce page
*/

angular.module('Clashtools.controllers')
.controller('AdminBounceCtrl', ['$rootScope', '$scope', '$location', 'moment', 'userService', 'authService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $location, moment, userService, authService, sessionService, errorService, clanService) {

    $rootScope.title = "Clashtools - Admin";

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;
        //runSearch('*');
    });

    $scope.parse = function(addresses) {
        $scope.all = addresses.split('\n');
        angular.forEach(addresses, function (address) {
            address = address.trim();
        });

        $scope.all.sort();
    }


    $scope.upload = function() {
        if ($scope.all.length > 0) {
            var data = { emails: $scope.all };
            userService.adminSetBounces(data, function (err, results) {
                if (err) {
                    $scope.resultMessage = err;
                }
                else {
                    $scope.resultMessage = 'Updated ' + results.records_updated + ' member accounts.'
                }
            });
        }
    }
}]);