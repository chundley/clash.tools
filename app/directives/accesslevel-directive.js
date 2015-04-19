'use strict';

/*
*   Directive to control access level on page elements
*/

angular.module('Clashtools.directives')
.directive('accessLevel', ['authService',
function (authService) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            var prevDisp = element.css('display');
            var userRole;
            var accessLevel;

            $scope.user = authService.user;

            $scope.$watch('user', function(user) {
                if(user.role) {
                    userRole = user.role;
                }
                updateCSS();
            }, true);

            attrs.$observe('accessLevel', function(al) {
                accessLevel = al;
                updateCSS();
            });

            function updateCSS() {
                if(userRole && accessLevel) {
                    if(!authService.authorize(accessLevel, userRole))
                        element.css('display', 'none');
                    else
                        element.css('display', prevDisp);
                }
            }
        }
    };

}]);