'use strict';

/*
*  Service for wars
*/

angular.module('Clashtools.services')
.factory('warService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        save: function(war, callback) {
            $http({
                url: '/crud/war',
                method: 'POST',
                data: war,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'save', data), null);
            });
        },
        assignBase: function(warId, model, callback) {
            $http({
                url: '/crud/war/assign/' + warId,
                method: 'POST',
                data: model,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'save', data), null);
            });
        },
        updateStars: function(warId, model, callback) {
            $http({
                url: '/crud/war/stars/' + warId,
                method: 'POST',
                data: model,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'save', data), null);
            });
        },
        saveBaseImage: function(warId, baseNum, model, callback) {
            $http({
                url: '/crud/war/' + warId + '/base/' + baseNum + '/image',
                method: 'POST',
                data: model,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'saveBaseImage', data), null);
            });
        },
        saveBaseNote: function(warId, baseNum, model, callback) {
            $http({
                url: '/crud/war/' + warId + '/base/' + baseNum + '/note',
                method: 'POST',
                data: model,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'saveBaseImage', data), null);
            });
        },
        deleteBaseNote: function(warId, baseNum, model, callback) {
            $http({
                url: '/crud/war/' + warId + '/base/' + baseNum + '/note',
                method: 'DELETE',
                data: model,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'saveBaseImage', data), null);
            });
        },
        getById: function(id, callback) {
            $http({
                url: '/crud/war/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('war-service.js', 'get', status), null);
            });
        },
        getActive: function(clanId, role, callback) {
            var url = '/crud/war/' + clanId + '/active';
            if (role == 'leader' || role == 'coleader') {
                url +='/admin';
            }
            $http({
                url: url,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                if (status==404) {
                    callback(null, null);
                }
                else {
                    callback(errorService.initMessage('war-service.js', 'get', status), null);
                }
            });
        },
        getHistory: function(clanId, callback) {
            $http({
                url: '/crud/wars/' + clanId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('war-service.js', 'get', status), null);
            });
        },
        delete: function(warId, callback) {
            $http({
                url: '/crud/war/' + warId,
                method: 'DELETE',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('clan-service.js', 'saveBaseImage', data), null);
            });
        },
        /*
        *   This has to be done in so many places, make it global to eliminate bugs and keep it DRY
        */
        callExpiration: function(war, warConfig, baseNum) {
            // set up baseline times
            var now = new Date();
            var warStart = new Date(war.start);
            var possibleExpireDate = new Date(now.getTime() + (warConfig.cleanup_attack_time*60*60*1000));
            var freeForAllDate = new Date(warStart.getTime() + ((24 - warConfig.free_for_all_time)*60*60*1000));
            var warEnd = new Date(warStart.getTime() + (24*60*60*1000)); 

            // override if assignment is happening before the war starts
            if (now.getTime() < warStart.getTime()) { // if not called yet, use first attack timer
                possibleExpireDate = new Date(warStart.getTime() + (warConfig.first_attack_time*60*60*1000));
            }

            // if this is the first call, needs special consideration
            if (war.bases[baseNum-1].a.length == 0) {

                // first, set possible expire time as war start time + first attack time
                var possibleExpireDateFirst = new Date(warStart.getTime() + (warConfig.first_attack_time*60*60*1000));
                
                // at this point if the war is already 14 hours old and the first attack timer is set at 12 hours,
                // the call will be incorrectly expired
                if (possibleExpireDateFirst.getTime() < now.getTime()) {
                    // in this case possibleExpireDate is correct (cleanup timer)
                }
                else {
                    if (possibleExpireDateFirst.getTime() < possibleExpireDate.getTime()) {
                        // in this case possibleExpireDate is correct (cleanup timer)
                    }
                    else {
                        possibleExpireDate = possibleExpireDateFirst;
                    }
                }

            }

            console.log('now: ' + now);
            console.log('start: ' + warStart);
            console.log('possible: ' + possibleExpireDate);
            console.log('freeforall: ' + freeForAllDate);
            console.log('end: ' + warEnd);

            // At this point the possible expire date is correct, but not the final answer. A
            // variety of overrides can happen (free for all time, war ends sooner than expire date, etc.)
            var expireDate = null;

            if (now.getTime() >= freeForAllDate.getTime()) {
                // already passed the free for all time
                expireDate = null;
                console.log('freeforall');
            }

            else if (possibleExpireDate.getTime() >= warEnd.getTime()) {
                // possible expire date is already greater than war end
                expireDate = warEnd;
                console.log('warend');
            }

            else {
                expireDate = possibleExpireDate;
                console.log('else');
            }
            return expireDate;                   
        }
    }
}]);
