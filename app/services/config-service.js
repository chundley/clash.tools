'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('configService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        hubspotConfig: function(callback) {
            $http({
                url: '/config/hubspot',
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('config-service.js', 'hubspotConfig', status), null);
            });
        }
    }
}]);
