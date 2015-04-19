'use strict';

/*
*   Controller for the registration page of the application
*/

angular.module('Clashtools.controllers')
.controller('RegisterCtrl', ['$rootScope', '$scope', '$location', 'md5', 'accountService', 'authService', 'sessionService', 'mailService', 'errorService',
function ($rootScope, $scope, $location, md5, accountService, authService, sessionService, mailService, errorService) {

    if (authService.isLoggedIn()) {
        $location.path('/home').replace();
    }

    $rootScope.title = "Register new user - clash.tools";

    $scope.register = function() {

        var newUser = {
            ign: $scope.ign,
            email_address: $scope.emailAddress,
            password: md5.createHash($scope.password),
            role: authService.userRoles.member,
            verified: false,
            clan: {},
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