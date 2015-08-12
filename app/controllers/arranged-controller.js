'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'arrangedWarService', 'CLAN_EMAILS', 'trackService',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, arrangedWarService, CLAN_EMAILS, trackService) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'arranged-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' arranged wars';

            arrangedWarService.getByClanId(meta.current_clan.clan_id, function (err, wars) {
                if (err) {
                    err.stack_trace.unshift( { file: 'arranged-controller.js', func: 'init', message: 'Error getting arranged wars' } );
                    errorService.save(err, function() {});
                }
                else {
                    angular.forEach(wars, function (war) {
                        war.created_at = new moment(war.created_at);
                        if (war.clan_1.clan_id == $scope.meta.current_clan.clan_id) {
                            war.opp = war.clan_2;
                        }
                        else {
                            war.opp = war.clan_1;
                        }
                    });

                    $scope.wars = wars;
                }
            });
        }
    });

    $scope.deleteMatch = function(war, index) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Delete arranged war?',
            message: 'Please confirm you want delete the arranged war between "' + war.clan_1.clan_name + '" and "' + war.clan_2.clan_name + '".',
            yesBtn: 'Delete',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {

                var emailMsg = {
                    subject: $scope.meta.current_clan.name + ' deleted an arranged war with you',
                    message: CLAN_EMAILS.arrangedRemove.replace(/\[1\]/g, war.clan_1.clan_name + ' and ' + war.clan_2.clan_name).replace(/\[2\]/g, $scope.meta.ign),
                    from_user: {
                        user_id: null, // looks screwey if in the outbox
                        ign: $scope.ign,
                        deleted: false
                    },
                    to_users: []
                };

                arrangedWarService.delete($scope.meta.current_clan.clan_id, war._id, emailMsg, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: '$scope.deleteMatch', message: 'Error with deleting arranged match' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $scope.wars.splice(index, 1);
                        trackService.track('deleted-arrangedwar');
                        $rootScope.globalMessage = 'Arranged match has been deleted.';
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
