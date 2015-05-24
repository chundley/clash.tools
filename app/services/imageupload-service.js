'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('imageUploadService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        upload: function(clanId, imgData, callback) {
            $http({
                url: '/crud/image/upload/' + clanId,
                method: 'POST',
                data: imgData,
                headers: {'Content-Type': 'image'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        }
    }
}]);
