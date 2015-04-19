'use strict';

angular.module('Clashtools.directives')
    .directive('footer', ['$location', function ($location) {
        return {
            restrict: 'A',
            templateUrl: '/views/partials/footer.html',
            scope: {}/*,
            link: function(scope, element, attrs) {
                scope.getActiveClass = function(page) {
                    if ($location.$$path.indexOf(page) > -1) {
                        return 'active';
                    }
                }

                scope.helpLink = function() {
                    // Path patterns for the app:
                    //      Root views:    /founder    /finance   etc.
                    //      Detail views   /founder/equity/GUID  /finance/b2b/GUID

                    // If there is only a single part, use it as the help link, otherwise
                    // create a detail link for help
                    var parts = $location.$$path.substring(1).split('/');
                    return parts.length > 1 ? parts[0] + '/detail' : parts[0];
                }
            }*/
        }
    }]);