'use strict';

/*
*  Service for player notes
*/

angular.module('Clashtools.services')
.factory('playerNotesService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        save: function(userId, note, callback) {
            $http({
                url: '/crud/playernotes/' + userId,
                method: 'POST',
                data: note,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('playernotes-service.js', 'save', status), null);
            });
        },
        get: function(userId, clanId, callback) {
            $http({
                url: '/crud/playernotes/' + userId + '/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('playernotes-service.js', 'get', status), null);
            });
        },
        delete: function(clanId, noteId, callback) {
            $http({
                url: '/crud/playernotes/' + clanId + '/' + noteId,
                method: 'DELETE'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('playernotes-service.js', 'get', status), null);
            });
        }        
    }
}]);
