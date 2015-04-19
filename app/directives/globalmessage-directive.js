'use strict';

/*
*   Directive for the global message
*/

angular.module('Clashtools.directives')
.directive('globalMessage', ['$rootScope', '$timeout',
function ($rootScope, $timeout) {

    // set timeout for the global message to fade out on its own
    $rootScope.$watch('globalMessage', function() {
        if ($rootScope.globalMessage && $rootScope.globalMessage.length > 0) {
            $timeout(function() {
                $rootScope.globalMessage = '';
            }, 3500);
        }
    });
    return {
        templateUrl: '/views/partials/globalMessage.html'
    }

}]);
