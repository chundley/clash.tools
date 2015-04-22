'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClansCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', 'authService', 'cacheService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'emailMessageService',
function ($rootScope, $scope, $routeParams, $location, $modal, authService, cacheService, sessionService, errorService, messagelogService, clanService, emailMessageService) {

    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';
    $rootScope.title = 'Find a clan - clash.tools';

    $scope.query = $routeParams.query;

    // don't display the asterix for the 'all' search
    if ($scope.query !== '*') {
        $scope.searchTerms = $scope.query;
    }

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.current_clan;
    });

    clanService.allClans($scope.query, function (err, clans) {
        $scope.clans = clans;
    });


    $scope.joinClan = function (clan) {
        $scope.modalOptions = {
            title: 'Join a Clan',
            message: 'Please confirm you want to join "' + clan.name + '". The leaders of the clan will be contacted for approval.',
            yesBtn: 'Join',
            noBtn: 'Cancel',
            onYes: function() {
                // need to send app emails to leaders and coleaders
                clanService.getMembers(clan._id, 'coleader,leader', function (err, members) {

                    // Log this activity
                    messagelogService.save(clan._id, '[ign] would like to join the clan', $scope.ign, 'member', function (err, msg) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan message in the log' } );
                            errorService.save(err, function() {});
                        }
                    });

                    var emailMsg = {
                        subject: $scope.ign + ' would like to join the clan',
                        message: 'There has just been a request to join the clan from ' + $scope.ign,
                        from_user: {
                            user_id: authService.user.id,
                            ign: $scope.ign
                        },
                        read: false,
                        deleted: false,
                        created_at: new Date()
                    };

                    angular.forEach(members, function (member) {
                        var newMsg = JSON.parse(JSON.stringify(emailMsg));
                        newMsg.to_user = {
                            user_id: member._id,
                            ign: member.ign
                        };

                        emailMessageService.save(newMsg, function (err, msg) {
                            if (err) {

                            }
                            else {
                                // do something yeah?
                            }
                        });
                    });
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
