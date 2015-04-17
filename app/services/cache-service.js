'use strict';

/*
*  Service for caching data
*/

angular.module('SiftrockApp.services')
.factory('cacheService', ['$cacheFactory',
function ($cacheFactory) {
    return $cacheFactory('fCache');
}]);
