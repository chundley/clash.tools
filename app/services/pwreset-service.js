'use strict';

/*
*  Service for password resets
*/

angular.module('SiftrockApp.services')
.factory('pwResetService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        getByToken: function(token, callback) {
            $http({
                url: '/crud/pwreset/' + token,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('pwreset-service.js', 'getByToken', status));
            });
        }
    }
}]);
