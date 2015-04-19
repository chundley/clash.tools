'use strict';

/*
*  Directive for numeric conversion
*
*  Bound fields are passed to the model as strings, this ensures types are converted correctly
*
*  http://stackoverflow.com/questions/15072152/angularjs-input-model-changes-from-integer-to-string-when-changed
*/

angular.module('Clashtools.directives')
.directive('integer', [
function () {
    return {
        require: 'ngModel',
        link: function(scope, ele, attr, ctrl){
            ctrl.$parsers.unshift(function(viewValue){
                return parseInt(viewValue);
            });
        }
    };
}])
.directive('float', [
function () {
    return {
        require: 'ngModel',
        link: function(scope, ele, attr, ctrl){
            ctrl.$parsers.unshift(function(viewValue){
                return parseFloat(viewValue);
            });
        }
    };
}]);
