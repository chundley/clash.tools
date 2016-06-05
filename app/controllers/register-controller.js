'use strict';

/*
*   Controller for the registration page of the application
*/

angular.module('Clashtools.controllers')
.controller('RegisterCtrl', ['$rootScope', '$scope', '$location', 'md5', 'authService', 'sessionService', 'mailService', 'errorService',
function ($rootScope, $scope, $location, md5, authService, sessionService, mailService, errorService) {

    if (authService.isLoggedIn()) {
        $location.path('/home').replace();
    }

    $rootScope.title = "Register new user - clash.tools";

    $scope.register = function() {
        var now = new Date();
        var tmpExpire = new Date(now.getTime() - 30*24*60*60*1000);
        var newUser = {
            ign: $scope.ign,
            player_tag: $scope.playerTag,
            email_address: $scope.emailAddress,
            password: md5.createHash($scope.password),
            role: authService.userRoles.member,
            profile: {
                public: true,
                avatar: '000000000000000000000000.png',
                bkUpgrade: tmpExpire,
                aqUpgrade: tmpExpire,
                gwUpgrade: tmpExpire,
                warWeight: 0,
                buildings: {
                    th: 1,
                    cc: 1
                },
                troops: {
                    barbarian: 1,
                    archer: 0,
                    giant: 0,
                    goblin: 0,
                    wallbreaker: 0,
                    balloon: 0,
                    wizard: 0,
                    healer: 0,
                    dragon: 0,
                    pekka: 0,
                    babydragon: 0,
                    miner: 0
                },
                dark_troops: {
                    minion: 0,
                    hogrider: 0,
                    valkyrie: 0,
                    golem: 0,
                    witch: 0,
                    lavahound: 0,
                    bowler: 0
                },
                spells: {
                    lightning: 0,
                    heal: 0,
                    rage: 0,
                    jump: 0,
                    freeze: 0,
                    clone: 0
                },
                dark_spells: {
                    poison: 0,
                    earthquake: 0,
                    haste: 0,
                    skeleton: 0
                },
                heroes: {
                    bk: 0,
                    aq: 0,
                    gw: 0
                },
                walls: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            last_login: now
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
