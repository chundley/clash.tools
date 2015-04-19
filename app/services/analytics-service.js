'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('analyticsService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        summary: function(account_id, num_days, callback) {
            $http({
                url: '/analytics/summary/' + account_id + '?days=' + num_days,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'summary', status), null);
            });
        },
        emailCountByDay: function(account_id, num_days, callback) {
            $http({
                url: '/analytics/emailcountbyday/' + account_id + '?days=' + num_days,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'emailCountByDay', status), null);
            });
        },
        emailCountByType: function(account_id, num_days, callback) {
            $http({
                url: '/analytics/emailcountbytype/' + account_id + '?days=' + num_days,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'emailCountByType', status), null);
            });
        },
        personCountByType: function(account_id, num_days, callback) {
            $http({
                url: '/analytics/personcountbytype/' + account_id + '?days=' + num_days,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'personCountByType', status), null);
            });
        },
        allPeople: function(account_id, num_days, callback) {
            $http({
                url: '/analytics/allpeople/' + account_id + '?days=' + num_days,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('analytics-service.js', 'allPeople', status), null);
            });
        }
    }
}]);
