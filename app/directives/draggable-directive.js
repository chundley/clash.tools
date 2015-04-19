'use strict';

/*
*  Directive for draggable divs
*/

angular.module('Clashtools.directives')
.directive('draggable', ['$document',
function ($document) {
    return function(scope, element, attr) {
        var startX = 0, startY = 0, x = 0, y = 0;

        if (attr.draggableStartX) {
            x = attr.draggableStartX;
        }

        if (attr.draggableStartY) {
            y = attr.draggableStartY;
        }

        element.on('mousedown', function(event) {
            // the element must include the draggable class. This is to prevent drag/drop events happening
            // in children of the parent draggable element (such as form controls)
            if (event.target.className.indexOf('draggable') >= 0) {
                // Prevent default dragging of selected content
                event.preventDefault();
                startX = event.screenX - x;
                startY = event.screenY - y;
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            }
        });

        function mousemove(event) {
            y = event.screenY - startY;
            x = event.screenX - startX;
            element.css({
              top: y + 'px',
              left:  x + 'px',
              opacity: .4
            });
        }

        function mouseup() {
            element.css({
              opacity: 1
            });
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
        }
    }
}]);