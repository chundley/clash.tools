'use strict';

/*
*   Controller for the registration page of the application
*/

angular.module('SiftrockApp.controllers')
.controller('RegisterCtrl', ['$rootScope', '$scope', '$location', 'md5', 'accountService', 'authService', 'sessionService', 'mailService', 'errorService',
function ($rootScope, $scope, $location, md5, accountService, authService, sessionService, mailService, errorService) {

    if (authService.isLoggedIn()) {
        $location.path('/home').replace();
    }

    $rootScope.title = "Siftrock - Register a new account";

    $scope.register = function() {

        var newUser = {
            name: $scope.name,
            company: $scope.company,
            email_address: $scope.emailAddress,
            nickname: $scope.emailAddress.substring(0, $scope.emailAddress.indexOf('@')),
            password: md5.createHash($scope.password),
            role: authService.userRoles.admin,
            verified: false,
            last_login: new Date()
        };

        authService.register(newUser, function (err, user) {
            if (err) {
                err.stack_trace.unshift( { file: 'register-controller.js', func: '$scope.register', message: 'Error on registration' } );
                errorService.save(err, function() {});
                $scope.hasError = true;
            }
            else {
                // set user context
                authService.changeUser(user, function() {
                    $location.path('/home').replace();
                });
            }
        });
    }
}]);