'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminClanCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'clanService',
function ($rootScope, $scope, $routeParams, $window, $location, $modal, moment, authService, sessionService, errorService, clanService) {

    $rootScope.title = "Clashtools - Admin - Clan";

    $scope.clanId = $routeParams.id;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'adminclan-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
        }

    });

    clanService.adminAllData($scope.clanId, function (err, clan) {
        if (err) {
            err.stack_trace.unshift( { file: 'adminclan-controller.js', func: 'init', message: 'Error getting clan data' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.clan = clan;
            angular.forEach($scope.clan.members, function (member) {
                member.joined = new moment(member.current_clan.joined);
            });

            $scope.clan.clan.age = new moment($scope.clan.clan.created_at);
        }

    });

    $scope.deleteClan = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Delete ' + $scope.clan.clan.name + '?',
            message: 'Please confirm you want to delete "' + $scope.clan.clan.name + '". All data associated with the clan will be removed, and members will be clanless.',
            yesBtn: 'Delete',
            noBtn: 'Cancel',
            cssClass: cssClass,
                onYes: function() {
                    clanService.deleteClan($scope.clan.clan._id, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'adminclan-controller.js', func: '$scope.deleteClan', message: 'Error deleting clan' } );
                            errorService.save(err, function() {});
                            rootScope.globalMessage = 'Something bad happened!';
                        }
                        else {
                            $rootScope.globalMessage = 'Clan ' + $scope.clan.clan.name + ' was deleted.';
                            $location.url('/admin').replace();
                        }
                    });
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/confirmDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }


}]);