'use strict';

/*
*  Directive for analytics tracking
*/

angular.module('Clashtools.directives')
.directive('track', ['$document', '$rootScope',
function ($document, $rootScope) {
    return function(scope, element, attr) {
        var trackEvent = attr.track;
        element.on('click', function(event) {
            if (trackEvent && trackEvent.length > 0 && !$rootScope.isSpoofing) {
                //mixpanel.track(trackEvent);
            }
        });
    }
}]);