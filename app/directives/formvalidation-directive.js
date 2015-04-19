'use strict';

/*
*  Directive for testing matching fields
*/

angular.module('Clashtools.directives')
.directive('fieldMatch', [
function () {
    return {
        require: 'ngModel',
        link: function (scope, elem , attrs, control) {

            control.$parsers.unshift(function (viewValue) {
                if (viewValue == scope[attrs.fieldMatch]) {
                    control.$setValidity('match', true);
                    return viewValue;
                }
                else {
                    control.$setValidity('match', false);
                    return undefined;
                }
            });
        }
    };
}])
.directive('domain', [
function () {
    return {
        require: 'ngModel',
        link: function(scope, ele, attr, ctrl){
            ctrl.$parsers.unshift(function(viewValue){
                if (viewValue.match(/^([a-zA-Z0-9-]+\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,10}?$/, 'g')) {
                    ctrl.$setValidity('domain', true);
                    return viewValue;
                }
                else {
                    ctrl.$setValidity('domain', false)
                    return null
                }
            });
        }
    };
}]);