'use strict';

/*
*   Directive to control access level on page elements (disable instead of hide)
*/

angular.module('Clashtools.directives')
.directive('accessLevelDisable', ['authService',
function (authService) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            var prevDisp = element.css('enabled');
            var userRole;
            var accessLevel;

            $scope.user = authService.user;

            $scope.$watch('user', function(user) {
                if(user.role) {
                    userRole = user.role;
                }
                updateCSS();
            }, true);

            attrs.$observe('accessLevelDisable', function(al) {
                accessLevel = al;
                updateCSS();
            });

            function updateCSS() {
                if(userRole && accessLevel) {
                    if(!authService.authorize(accessLevel, userRole)) {
                        element.attr('disabled', 'disabled');
                    }
                    else {
                        element.attr('disabled', '');
                    }
                }
            }
        }
    };

}]);