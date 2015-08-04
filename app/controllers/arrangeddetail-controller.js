'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedDetailCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'CLAN_EMAILS',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, CLAN_EMAILS) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' arranged war';

            if ($routeParams.id == 'new') {
                $scope.newWar = true;
            }
            else {
                $scope.newWar = false;
            }
        }
    });

    $scope.search = function(terms) {
        if (terms.length > 0) {
            clanService.allClans(terms, 20, function (err, clans) {
                $scope.clans = clans;
            });
        }
    }

    $scope.startMatch = function(clan) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Start an arranged war with ' + clan.name + '?',
            message: 'Please confirm you want start an arranged war with "' + clan.name + '". The match will be created and the leaders of the other clan will be notified.',
            yesBtn: 'Start',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {

                var emailMsg = {
                    subject: $scope.meta.current_clan.name + ' would like to set up an arranged war',
                    message: CLAN_EMAILS.arranged.replace(/\[1\]/g, $scope.meta.current_clan.name),
                    from_user: {
                        user_id: null, // looks screwey if in the outbox
                        ign: $scope.ign,
                        deleted: false
                    },
                    to_users: []
                };

                var metaData = {
                    clanId: clan._id,
                    email: emailMsg
                };

                clanService.arrangedRequest($scope.meta.current_clan.clan_id, metaData, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.joinClan', message: 'Error with join clan request' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = 'Your request for an arranged war with "' + clan.name + '" has been sent.';
                    }
                });

                $location.url('/arranged').replace();
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
