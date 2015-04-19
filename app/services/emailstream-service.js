'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('emailStreamService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        getEmailCount: function(account_id, filters, callback) {
            $http({
                url: '/crud/mailstreamcount/' + account_id + '?filters=' + JSON.stringify(filters),
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('emailstream-service.js', 'getEmailCount', status), null);
            });
        },
        getByAccountId: function(id, pagesize, page, filters, callback) {
            $http({
                url: '/crud/mailstream/' + id + '?pagesize=' + pagesize + '&pagedelta=' + page + '&filters=' + JSON.stringify(filters),
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('emailstream-service.js', 'getByAccountId', status), null);
            });
        },
        getEmailDetail: function(account_id, email_id, callback) {
            $http({
                url: '/crud/mailstream/' + account_id + '/emaildetail/' + email_id,
                method: 'GET',
                cache: true
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('emailstream-service.js', 'getEmailDetail', status), null);
            });
        },
        setHidden: function(account_id, email_id, callback) {
            $http({
                url: '/crud/mailstream/' + account_id + '/hide/' + email_id,
                method: 'POST',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('emailstream-service.js', 'setHidden', status), null);
            });
        }
    }

}]);
