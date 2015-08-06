'use strict';

/*
*  Service for arranged wars
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
        save: function(clanId, model, callback) {
            $http({
                url: '/crud/arranged/' + clanId,
                method: 'POST',
                data: model,
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
                callback(errorService.initMessage('arrangedwar-service.js', 'getByClanId', status), null);
            });
        },
        delete: function(clanId, modelId, callback) {
            $http({
                url: '/crud/arranged/' + clanId + '/' + modelId,
                method: 'DELETE'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('arrangedwar-service.js', 'delete', status), null);
            });
        }
    }
}]);
