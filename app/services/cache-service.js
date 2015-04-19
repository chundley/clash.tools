'use strict';

/*
*  Service for caching data
*/

angular.module('Clashtools.services')
.factory('cacheService', ['$cacheFactory',
function ($cacheFactory) {
    return $cacheFactory('fCache');
}]);
