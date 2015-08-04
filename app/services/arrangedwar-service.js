'use strict';

/*
*  Service for player notes
*/

angular.module('Clashtools.services')
.factory('arrangedWarService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        get: function(id, callback) {
            $http({
                url: '/crud/arranged/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('arrangedwar-service.js', 'get', status), null);
            });
        },        
        save: function(userId, note, callback) {
            $http({
                url: '/crud/playernotes/' + userId,
                method: 'POST',
                data: note,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('arrangedwar-service.js', 'save', status), null);
            });
        },
        getByClanId: function(clanId, callback) {
            $http({
                url: '/crud/arranged/clan/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('arrangedwar-service.js', 'get', status), null);
            });
        },
        delete: function(clanId, noteId, callback) {
            $http({
                url: '/crud/playernotes/' + clanId + '/' + noteId,
                method: 'DELETE'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('arrangedwar-service.js', 'get', status), null);
            });
        }        
    }
}]);
