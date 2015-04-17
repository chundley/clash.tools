'use strict';

/*
*  Service for accounts
*/

angular.module('SiftrockApp.services')
.factory('nlpConfigService', ['$http', 'cacheService', 'errorService',
function ($http, cacheService, errorService) {
    return {
        save: function(nlpConf, callback) {
            $http({
                url: '/crud/admin/nlpconfig',
                method: 'POST',
                data: nlpConf,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('nlpconfig-service.js', 'save', data), null);
            });
        },
        get: function(callback) {
            $http({
                url: '/crud/admin/nlpconfig',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('nlpconfig-service.js', 'get', status), null);
            });
        }
    }
}]);
