'use strict';

/*
*  Service for the Hubspot API
*/

angular.module('SiftrockApp.services')
.factory('hubspotService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        verifyCredentials: function(accountId, callback) {
            $http({
                url: '/hubspot/auth/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('hubspot-service.js', 'verifyCredentials', status), null);
            });
        },
        getLists: function(accountId, callback) {
            $http({
                url: '/hubspot/lists/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('hubspot-service.js', 'verifyCredentials', status), null);
            });
        },
        getFields: function(accountId, callback) {
            $http({
                url: '/hubspot/fields/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('hubspot-service.js', 'verifyCredentials', status), null);
            });
        }
    }
}]);
