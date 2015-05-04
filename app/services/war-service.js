'use strict';

/*
*  Service for wars
*/

angular.module('Clashtools.services')
.factory('warService', ['$http', 'errorService',
function ($http, errorService) {
    return {
/*        save: function(clan, callback) {
            $http({
                url: '/crud/clan',
                method: 'POST',
                data: clan,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                if (status == 403) {
                    console.log(data);
                    callback(null, null);
                }
                else {
                    callback(errorService.initMessage('clan-service.js', 'save', data), null);
                }
            });
        },*/
        getById: function(id, callback) {
            $http({
                url: '/crud/clan/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('war-service.js', 'get', status), null);
            });
        },
        getActive: function(clanId, callback) {
            $http({
                url: '/war/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                if (status==404) {
                    callback(null, null);
                }                
                callback(errorService.initMessage('war-service.js', 'get', status), null);
            });            
        }
/*        allClans: function(query, callback) {
            $http({
                url: '/crud/clans/' + query,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'get', status), null);
            });
        },
        getMembers: function(clanId, types, callback) {
            $http({
                url: '/crud/clan/' + clanId + '/members?types=' + types,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'get', status), null);
            });
        }*/
    }
}]);
