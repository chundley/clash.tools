'use strict';

/*
*  Service for the ban list
*/

angular.module('Clashtools.services')
.factory('banListService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        save: function(clanId, note, callback) {
            $http({
                url: '/crud/banlist/' + clanId,
                method: 'POST',
                data: note,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('banlist-service.js', 'save', status), null);
            });
        },
        get: function(clanId, callback) {
            $http({
                url: '/crud/banlist/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('banlist-service.js', 'get', status), null);
            });
        },
        getByUserId: function(userId, clanId, callback) {
            $http({
                url: '/crud/banlist/' + clanId + '/' + userId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('banlist-service.js', 'get', status), null);
            });
        },        
        delete: function(userId, clanId, callback) {
            $http({
                url: '/crud/banlist/' + clanId + '/' + userId,
                method: 'DELETE'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('banlist-service.js', 'get', status), null);
            });
        }        
    }
}]);
