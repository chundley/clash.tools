'use strict';

/*
*  Service for attack results
*/

angular.module('Clashtools.services')
.factory('attackResultService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        getByClanId: function(clanId, callback) {
            $http({
                url: '/crud/ar/' + clanId,
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('attackresult-service.js', 'save', getByClanId), null);
            });
        },
        getByWarId: function(warId, callback) {
            $http({
                url: '/crud/ar/war/' + warId,
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('attackresult-service.js', 'save', getByClanId), null);
            });
        }
    }
}]);
