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
                if (attr.trackMeta) {
                    var temp = JSON.parse(attr.trackMeta);
                    Intercom('trackEvent', trackEvent, temp);
                    //Intercom('trackEvent', trackEvent);
                }
                else {
                    Intercom('trackEvent', trackEvent);
                }
            }
        });
    }
}]);