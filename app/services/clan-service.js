'use strict';

/*
*  Service for clans
*/

angular.module('Clashtools.services')
.factory('clanService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        save: function(clan, callback) {
            $http({
                url: '/crud/clan',
                method: 'POST',
                data: clan,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                if (status == 403) {
                    callback(null, null);
                }
                else {
                    callback(errorService.initMessage('clan-service.js', 'save', data), null);
                }
            });
        },
        getById: function(id, callback) {
            $http({
                url: '/crud/clan/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'getById', status), null);
            });
        },
        allClans: function(query, count, callback) {
            $http({
                url: '/crud/clans/' + query + '?count=' + count,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'allClans', status), null);
            });
        },
        getMembers: function(clanId, types, callback) {
            $http({
                url: '/crud/clan/' + clanId + '/members?types=' + types,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'getMembers', status), null);
            });
        },
        getRoster: function(clanId, callback) {
            $http({
                url: '/crud/clan/' + clanId + '/roster',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'getRoster', status), null);
            });
        },
        arrangedRequest: function (clanId, metaData, callback) {
            $http({
                url: '/crud/clan/' + clanId + '/arrange',
                method: 'POST',
                data: metaData
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'arrangedRequest', status), null);
            });
        },        
        adminAllData: function(clanId, callback) {
            $http({
                url: '/crud/admin/clan/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'adminAllData', status), null);
            });
        },
        adminAllClans: function(query, count, callback) {
            $http({
                url: '/crud/admin/clans/' + query + '?count=' + count,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'allClans', status), null);
            });
        }        
    }
}]);
