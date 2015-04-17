'use strict';

/*
*   Controller for the admin page
*/

angular.module('SiftrockApp.controllers')
.controller('PWResetCtrl', ['$rootScope', '$scope', '$routeParams', 'md5', 'userService', 'pwResetService', 'errorService',
function ($rootScope, $scope, $routeParams, md5, userService, pwResetService, errorService) {

    $rootScope.title = "Siftrock - Password reset request";

    var token = $routeParams.id;


    pwResetService.getByToken(token, function (err, data) {
        if (err) {
            err.stack_trace.unshift( { file: 'pwreset-controller.js', func: 'init', message: 'Error getting reset request' } );
            errorService.save(err, function() {});
            $scope.badToken = true;
        }
        else if (!data._id) {
            // no token
            $scope.badToken = true;
        }
        else {
            $scope.userId = data.user_id;
        }
    });  

    $scope.reset = function() {
        userService.changePassword($scope.userId, md5.createHash($scope.pw1), function (err, data) {
            if (err) {
                err.stack_trace.unshift( { file: 'pwreset-controller.js', func: '$scope.reset', message: 'Error changing password' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.success = true;
            }
        })
    }
}]);
