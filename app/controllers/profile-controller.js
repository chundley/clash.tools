'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ProfileCtrl', ['$rootScope', '$scope', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'userService',
function ($rootScope, $scope, moment, authService, cacheService, sessionService, errorService, userService) {
    // initialize
    $rootScope.title = 'Profile - clash.tools';

    userService.getById(authService.user.id, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'profile-controller.js', func: 'init', message: 'Error getting user' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.user = user;
        }
    });

    $scope.saveUser = function() {
        console.log('here');
        userService.update($scope.user._id, $scope.user, function (err, newUser) {
            if (err) {
                err.stack_trace.unshift( { file: 'profile-controller.js', func: '$scope.saveUser', message: 'Error saving user' } );
                errorService.save(err, function() {});
            }  
            else {
                $scope.user = newUser;
            }          
        });
    }

/*    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.current_clan;

        if ($scope.clan.clan_id) {
            messagelogService.get($scope.clan.clan_id, 10, function (err, messages) {
                angular.forEach(messages, function (message) {
                    message.created_at = new moment(message.created_at);
                    message.message = message.message.replace('[ign]', '<b class="emphasis">' + message.ign + '</b>');
                });
                $scope.clanMessages = messages;
            });
        }
    });*/

}]);