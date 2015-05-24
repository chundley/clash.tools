'use strict';

/*
*  Service for accounts
*/

angular.module('Clashtools.services')
.factory('imageUploadService', ['$http', 'errorService', 'Upload',
function ($http, errorService, Upload) {
    return {
        uploadAvatar: function(userId, file, callback) {
            Upload.upload({
                url: '/crud/image/avatar/' + userId,
                file: file
            }).success(function (data, status, headers, config) {
                callback(null, null);
            }).
            error(function (data, status, headers, config) {
                callback(err, null);
            });
        }
/*        upload: function(clanId, file, callback) {
            $http({
                url: '/crud/image/upload/' + clanId,
                method: 'POST',
                data: file,
                headers: {'Content-Type': 'image'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        }*/
    }
}]);
