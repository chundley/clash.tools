'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('mailService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        pwReset: function(email, callback) {
            $http({
                url: '/mail/pwreset/' + email,
                method: 'POST',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        },
        verifyEmail: function(id, callback) {
            $http({
                url: '/mail/verifyemail/' + id,
                method: 'POST',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('mail-service.js', 'verifyEmail', status));
            });
        },
        welcome: function(userId, callback) {
            $http({
                url: '/mail/welcome/' + userId,
                method: 'POST',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        },
        alpha: function(formData, callback) {
            $http({
                url: '/mail/alpha',
                method: 'POST',
                data: formData,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        },
        wwwForm: function(formData, callback) {
            $http({
                url: '/mail/wwwForm',
                method: 'POST',
                data: formData,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        }
    }

}]);
