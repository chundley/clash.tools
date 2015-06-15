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
                callback(null, data);
            }).
            error(function (data, status, headers, config) {
                callback(errorService.initMessage('imgupload-service.js', 'uploadAvatar', status));
            });
        },
        upload: function(clanId, file, callback) {
            Upload.upload({
                url: '/crud/image/clan/' + clanId,
                file: file
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).
            error(function (data, status, headers, config) {
                callback(errorService.initMessage('imgupload-service.js', 'upload', status));
            });
        }
    }
}]);
