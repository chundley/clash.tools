'use strict';

angular.module('Clashtools.services')
.factory('utils', [
function () {
    return {
        createGUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },
        randString: function(length) {
            var text = '';
            var possible = 'abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
            for( var i=0; i < length; i++ ) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        },
        zeroArray: function(length) {
            var intArray = [];
            while (length--) {
                intArray[length] = 0;
            }
            return intArray;
        }
    }

}]);