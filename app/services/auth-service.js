'use strict';

/*
*  Service for authentication / authorization
*/

angular.module('Clashtools.services')
.factory('authService', ['$http', '$rootScope', '$cookieStore', 'md5', 'accountService', 'sessionService', 'cacheService', 'errorService',
function ($http, $rootScope, $cookieStore, md5, accountService, sessionService, cacheService, errorService) {
    var accessLevels = roleConfig.accessLevels;
    var userRoles = roleConfig.userRoles;
    var currentUser = $cookieStore.get('f_user') || { id: null, email: null, role: userRoles.public };
    var currentAccount = null;

    // this was just temporary for server -> client communication
    $cookieStore.remove('f_user');

    return {
        authorize: function(accessLevel, role) {
            if (role === undefined) {
                role = currentUser.role;
            }
            if (accessLevels[accessLevel] === undefined) {
                accessLevel = currentUser.accessLevel;
            }
            return accessLevels[accessLevel].bitMask & role.bitMask;
        },
        isLoggedIn: function() {
            return loggedIn();
        },
        isInRoll: function(role) {
            if (this.user.roles.indexOf(role) > -1) {
                return true;
            }
            else {
                return false;
            }
        },
        register: function(user, callback) {
            $http({
                url: '/auth/register',
                method: "POST",
                data: user,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                mixpanel.track("Registration completed");
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('auth-service.js', 'register', status, user.email_address), null);
            });
        },
        login: function(user, callback) {
            $http({
                url: '/auth/login',
                method: "POST",
                data: user,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                changeUser(data, function() {
                    mixpanel.track("Login completed");
                    callback(null);
                });
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('auth-service.js', 'login', status, user.email), null);
            });
        },
        logout: function(callback) {
            $http({
                url: '/auth/logout',
                method: "POST"
            }).success(function () {
                changeUser({ _id: null, email_address: null, role: userRoles.public }, function() {
                    callback(null);
                });
            }).error(function () {
                callback(errorService.initMessage('auth-service.js', 'logout', status));
            });

        },
        // used for registration case only - change user needs to happen after other
        // account meta data is created
        changeUser: function(user, callback) {
            changeUser(user, function () {
                callback();
            });
        },
        spoofUser: function(user, callback) {
            $rootScope.isSpoofing = true;
            sessionService.clearSession();
            sessionService.setRealUser(currentUser, function() {
                changeUser(user, function() {
                    callback();
                });
            });
        },
        user: currentUser,
        userRoles: userRoles,
        accessLevels: accessLevels
    }

    // NOTE: changed to an async function on 6/12/14 to make sure session gets set before moving past
    // authentication. There's no error handling and a lot could go wrong here - refactor when someone gets a chance
    function changeUser(user, callback) {
        angular.extend(currentUser, { id: user.id, email: user.email, role: user.role });
        if (loggedIn()) {
            // mixpanel
            if (!$rootScope.isSpoofing) {
                mixpanel.identify(currentUser.id);
                mixpanel.people.set({
                    "$first_name": currentUser.email,
                    "$email": currentUser.email
                });
            }

            callback();
        }
        else {
            callback();
        }
    }

    function getAccount(userid, callback) {
        accountService.getByUserId(userid, function (err, account) {
            if (err) {
                // TODO: err
            }
            callback(err, account);
        });
    }

    function loggedIn() {
        return currentUser.role.title !== "public";
    }
}]);
