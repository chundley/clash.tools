'use strict';

/*
*  Service for accounts
*/

angular.module('SiftrockApp.services')
.factory('accountService', ['$http', 'cacheService', 'errorService',
function ($http, cacheService, errorService) {
    return {
        save: function(account, callback) {
            $http({
                url: '/crud/account',
                method: 'POST',
                data: account,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('account-service.js', 'save', data), null);
            });
        },
        get: function(id, callback) {
            $http({
                url: '/crud/account/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('account-service.js', 'get', status), null);
            });
        },
        getByUserId: function(id, callback) {
            $http({
                url: '/crud/account/user/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                console.log(status);
                console.log(data);
                callback(errorService.initMessage('account-service.js', 'getByUserId', data), null);
            });
        },
        getUsers: function(id, callback) {
            $http({
                url: '/crud/account/' + id + '/users',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'getUsers', status), null);
            });
        },
        addUser: function(id, user, callback) {
            $http({
                url: '/crud/account/' + id + '/users',
                method: 'POST',
                data: user,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                if (status==403) {
                    // special case if the user already exists in the system
                    callback(null, null);
                }
                else {
                    callback(errorService.initMessage('account-service.js', 'save', data), null);
                }
            });
        },
        adminAllAccounts: function(callback) {
            $http({
                url: '/crud/admin/account',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'adminAllAccounts', status), null);
            });
        }
    }
}]);
