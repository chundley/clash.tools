'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('EmailVerifyCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$timeout', 'userService', 'errorService',
function ($rootScope, $scope, $routeParams, $location, $timeout, userService, errorService) {

    $rootScope.title = "Siftrock - Verify Email";

    var token = $routeParams.id;

    userService.getByVerifyToken(token, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'emailverify-controller.js', func: 'init', message: 'Error getting verify token' } );
            errorService.save(err, function() {});
            $scope.badToken = true;
        }
        else if (!user._id) {
            // no token
            $scope.badToken = true;
        }
        else {
            userService.setVerified(user._id, function (err, result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'emailverify-controller.js', func: 'init', message: 'Error on setting verified' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.success = true;

                    $timeout(function() {
                        $location.path('/home').replace();
                    }, 4000);
                }
            });
        }
    });
}]);
