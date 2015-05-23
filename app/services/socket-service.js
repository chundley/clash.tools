angular.module('Clashtools.services')
.factory('ctSocket', ['socketFactory',
function (socketFactory) {
    return socketFactory();
}]);