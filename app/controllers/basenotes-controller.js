'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('BaseNotesCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'messagelogService', 'warService',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, messagelogService, warService) {

    $scope.warId = $routeParams.id;
    $scope.baseNum = $routeParams.baseNum;

    loadWar(function() {});

    function loadWar(callback) {
        warService.getById($scope.warId, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'loadWar', message: 'Error getting current war' } );
                errorService.save(err, function() {});
                callback();
            }
            else {
                if (war) {
                    $scope.war = war;
                    callback();
                }
                else {
                    callback();
                }
            }
        });
    }

}]);
