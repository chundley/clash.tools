'use strict';

/*
*  Service for the Marketo API
*/

angular.module('SiftrockApp.services')
.factory('marketoService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        verifyCredentials: function(creds, callback) {
            $http({
                url: '/marketo/auth',
                method: 'POST',
                data: creds,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('marketo-service.js', 'verifyCredentials', status), null);
            });
        },
        getLists: function(accountId, callback) {
            $http({
                url: '/marketo/lists/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('marketo-service.js', 'getLists', status), null);
            });
        },
        getFields: function(accountId, callback) {
            $http({
                url: '/marketo/fields/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('marketo-service.js', 'getFields', status), null);
            });
        }
    }
}]);
