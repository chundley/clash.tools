'use strict';

/*
*   Controller for the generic confirmation modal dialog
*/

angular.module('SiftrockApp.controllers')
.controller('ConfirmationCtrl', ['$scope', '$modalInstance', 'dialogTitle', 'yesBtn', 'noBtn',
function ($scope, $modalInstance, dialogTitle, yesBtn, noBtn) {

    $scope.dialogTitle = dialogTitle;
    $scope.yesBtn = yesBtn;
    $scope.noBtn = noBtn;

    // calls back with a 'yes' response
    $scope.yes = function() {
        $modalInstance.close(1);
    }

    // calls back with 'no' response
    $scope.no = function() {
        $modalInstance.close(0);
    }

}]);