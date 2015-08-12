'use strict';

angular.module('Clashtools.services')
.factory('trackService', [
function () {
    return {
        track: function(eventName, meta) {
            if (meta) {
                Intercom('trackEvent', eventName, meta);
            }
            else {
                Intercom('trackEvent', eventName);
            }
        }
    }
}]);