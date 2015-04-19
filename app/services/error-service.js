'use strict';

/*
*  Service for errors
*/

angular.module('Clashtools.services')
.factory('errorService', ['$http', 'cacheService',
function ($http, cacheService) {
    return {
        save: function(error, callback) {
            $http({
                url: '/crud/error',
                method: 'POST',
                data: error,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        },
        initMessage: function(file, func, message, u) {
            // user can be passed in when there is no logged in user, such as
            // invalid password on login
            var user = 'n/a';
            if (u) {
                user = u;
            }
            else if (cacheService.get('user')) {
                user = cacheService.get('user').email;
            }

            var newMsg = {
                type: 'client',
                user_id: user,
                stack_trace: [],
                extended_data: {}
            };

            if (file && func && message) {
                newMsg.stack_trace.push({
                    file: file,
                    func: func,
                    message: message
                });
            }
            return newMsg;
        }
    }

}]);
