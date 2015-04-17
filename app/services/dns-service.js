'use strict';

/*
*  Service for dns lookups
*/

angular.module('SiftrockApp.services')
.factory('dnsService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        mxRecords: function(domain, callback) {
            $http({
                url: '/dns/mx/' + domain,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('dns-service.js', 'emailCountByDay', status), null);
            });
        }
    }
}]);
