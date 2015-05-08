'use strict';

/*
*   Controller for the login page of the application
*/

angular.module('Clashtools.controllers')
.controller('LoginCtrl', ['$rootScope', '$scope', '$location', '$modal', 'md5', 'authService', 'mailService', 'errorService',
function ($rootScope, $scope, $location, $modal, md5, authService, mailService, errorService) {

    if (authService.isLoggedIn()) {
        $location.path('/home').replace();
    }

    $rootScope.title = 'clash.tools - Log in to your account';

    $scope.login = function() {

        var user = {
            email: $scope.emailAddress,
            password: md5.createHash($scope.password),
            remember: $scope.rememberMe
        };

        authService.login(user, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'login-controller.js', func: '$scope.login', message: 'Error on login' } );
                errorService.save(err, function() {});
                $scope.hasError = true;
            }
            else {
                $location.path('/home');
            }
        });
    }

    $scope.pwReset = function() {
        $scope.modalOptions = {
            emailAddress: $scope.emailAddress,
            onSave: function(emailAddress) {
                sendPWReset(emailAddress);
                $scope.reset = true;
            },
            onCancel: function() {
                // do nothing
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-scale',
                placement: 'center',
                template: "/views/partials/pwReset.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    function sendPWReset(emailAddress) {
        console.log(emailAddress);
        mailService.pwReset(emailAddress, function (err, something) {
        });
    }

}]);