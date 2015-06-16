'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('analyticsService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        summaryMetrics: function(callback) {
            $http({
                url: '/analytics/summary',
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'summary', status), null);
            });
        }
    }
}]);
