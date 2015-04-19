'use strict';

/*
*   Controller for the settings page of the application
*/

angular.module('Clashtools.controllers')
.controller('IntegrationCtrl', ['$rootScope', '$scope', '$location', '$routeParams', '$window', '$modal', 'authService', 'sessionService', 'accountService', 'hubspotService', 'marketoService', 'configService', 'errorService', 'messagelogService',
function ($rootScope, $scope, $location, $routeParams, $window, $modal, authService, sessionService, accountService, hubspotService, marketoService, configService, errorService, messagelogService) {

    $rootScope.title = "Siftrock - Settings";
    $scope.helpLink = 'http://www.siftrock.com/help/integration/';

    sessionService.getUserSession(authService.user.id, function (err, session) {
        if (err) {
            err.stack_trace.unshift( { file: 'integration-controller.js', func: 'init', message: 'Error getting user session' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.userSession = session;
            changeTabInternal('integration');
        }
    });

    accountService.getByUserId(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'integration-controller.js', func: 'init', message: 'Error getting account' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.account = account;

            // OAuth handshakes - re-directs from auth will come back with an id
            if ($routeParams.id) {
                if ($routeParams.id === 'hubspot') {
                    // re-direct back will have ?error='access_denied' if they cancel authorization
                    var cancelled = $location.search().error;
                    if (!cancelled) {
                        var accessToken = $location.search().access_token;
                        var refreshToken = $location.search().refresh_token;

                        // don't need to check tokens because Hubspot won't re-direct if there's a problem
                        $scope.account.integration.hubspot.access_token = accessToken;
                        $scope.account.integration.hubspot.refresh_token = refreshToken;
                    }
                    else {
                        $scope.account.integration.hubspot = null;
                    }

                    // regardless of whether we got valid credentials, save the account and redirect
                    $scope.hubspotConfig = $scope.account.integration.hubspot;
                    saveAccountInternal(function (err, account) {
                        $location.url('/settings/integration').replace();
                    });
                }
                else {
                    $location.url('/settings/integration').replace();
                }
            }

            else {
                // Normal page load

                // Hubspot config
                if ($scope.account.integration.hubspot) {
                    $scope.hubspotConfig = $scope.account.integration.hubspot;
                    testHubspotCredentials(function (err, result) {
                        // TODO: err
                    });
                }
                else {
                    $scope.hubspotConfig = null;
                }

                // Marketo config
                if ($scope.account.integration.marketo) {
                    $scope.marketoConfig = $scope.account.integration.marketo;
                    testMarketoFields(function (err, fields) {
                        // TODO: err
                    });
                }
                else {
                    $scope.marketoConfig = null;
                }

                if ($location.search().hint === 'marketo') {
                    configMarketoInternal();
                }

                else if ($location.search().hint === 'hubspot') {
                    configHubspotInternal();
                }

                if (!$scope.marketoConfig &&
                    !$scope.hubspotConfig) {
                    $scope.nullState = true;
                }
                else {
                    $scope.nullState = false;
                }
            }
        }
    });

    $scope.changeTab = function(tab) {
        changeTabInternal(tab);
    }

    // this should be temporary and removed once settings is broken into separate controllers
    function changeTabInternal(tab) {
        $scope.userSession.settings_tab = tab;
        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, session) {
            if (err) {
                err.stack_trace.unshift( { file: 'integration-controller.js', func: 'changeTab', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
            else {
                if (tab != 'integration') {
                    $location.path('/settings');
                }
            }
        });
    }

    $scope.configHubspot = function() {
        configHubspotInternal();
    }

    function configHubspotInternal() {
        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            formData: {
                hubId: $scope.hubspotConfig ? $scope.hubspotConfig.hub_id : ''
            },
            onYes: function(formdata) {
                $scope.hubspotConfig = {
                    hub_id: formdata.hubId,
                    access_token: '',
                    refresh_token: '',
                    created_at: new Date(),
                    created_by: $scope.user._id
                };

                $scope.account.integration.hubspot = $scope.hubspotConfig;

                saveAccountInternal(function (err, account) {
                    if (err) {
                        // TODO: err
                    }
                    else {
                        // make sure the display updates
                        $scope.nullState = false
                    }
                });

                modalInstance.hide();

                configService.hubspotConfig(function (err, config) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'integration-controller.js', func: 'configHubspotInternal', message: 'Error getting Hubspot config' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        var hubspotAuth = config.authUrl + '?client_id=' + config.clientId + '&portalId=' + $scope.hubspotConfig.hub_id + '&redirect_uri=' + config.redirectUrl + '&scope=contacts-rw+offline';
                        window.location.href = hubspotAuth;
                    }
                });

                messagelogService.save(
                    $scope.account._id,
                    'Updated Hubspot configuration',
                    'action',
                    { new_value: $scope.hubspotConfig.hub_id },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'integration-controller.js', func: '$scope.configHubspot', message: 'Error saving log message' } );
                            errorService.save(err, function() {});
                        }
                    }
                );
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/configHubspotDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    /*
    *   Test Hubspot credentials
    */
    function testHubspotCredentials(callback) {
        hubspotService.verifyCredentials($scope.account._id, function (err, result) {
            if (err) {
                $scope.hubspotStatus = 0;
                callback(err, null);
            }
            else {
                $scope.hubspotStatus = 2;
                callback(null, result);
            }
        });
    }

    $scope.configMarketo = function() {
        configMarketoInternal();
    }

    function configMarketoInternal() {
        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            formData: {
                endpoint: $scope.marketoConfig ? $scope.marketoConfig.endpoint : '',
                identity: $scope.marketoConfig ? $scope.marketoConfig.identity : '',
                clientId: $scope.marketoConfig ? $scope.marketoConfig.client_id : '',
                clientSecret: $scope.marketoConfig ? $scope.marketoConfig.client_secret : ''
            },
            onYes: function(formdata) {
                $scope.marketoConfig = {
                    endpoint: formdata.endpoint,
                    identity: formdata.identity,
                    client_id: formdata.clientId,
                    client_secret: formdata.clientSecret,
                    access_token: '',
                    created_at: new Date(),
                    created_by: $scope.user._id
                };

                testMarketoCredentials(function (err, result) {
                    if (err) {
                        $scope.marketoConfig.access_token = '';
                    }
                    else {
                        $scope.marketoConfig.access_token = result.access_token;
                    }

                    // save regardless
                    $scope.account.integration.marketo = $scope.marketoConfig;

                    saveAccountInternal(function (err, account) {
                        if (err) {
                            // TODO: err
                        }
                        else {

                            // make sure the display updates
                            $scope.nullState = false

                            // see if Marketo fields are set up correctly
                            testMarketoFields(function (err, fields) {
                                console.log(fields);
                                console.log($scope.marketoStatus);
                            });
                        }
                    });
                });

                modalInstance.hide();

                messagelogService.save(
                    $scope.account._id,
                    'Updated Marketo configuration',
                    'action',
                    { new_value: $scope.marketoConfig.endpoint },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'integration-controller.js', func: '$scope.configMarketo', message: 'Error saving log message' } );
                            errorService.save(err, function() {});
                        }
                    }
                );
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/configMarketoDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    /*
    *   Test Marketo credentials
    */
    function testMarketoCredentials(callback) {
        var creds = {
            identity_url: $scope.marketoConfig.identity,
            client_id: $scope.marketoConfig.client_id,
            client_secret: $scope.marketoConfig.client_secret
        };

        marketoService.verifyCredentials(creds, function (err, result) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, result);
            }
        });
    }

    /*
    *   Test for required Marketo fields - set $scope.marketoStatus to:
    *
    *   0 = auth failed
    *   1 = auth good, missing fields
    *   2 = everything is good
    *
    */
    function testMarketoFields(callback) {
        var reqFields = [
            {
                name: 'siftrockCreated',
                found: 0
            },
            {
                name: 'siftrockReplyType',
                found: 0
            },
            {
                name: 'siftrockURL',
                found: 0
            }
        ];

        marketoService.getFields($scope.account._id, function (err, fields) {
            if (err) {
                $scope.marketoStatus = 0;
                callback(err, null);
            }
            else {
                $scope.marketoStatus = 2;
                angular.forEach(reqFields, function (reqField) {
                    angular.forEach(fields, function (field) {
                        if (reqField.name === field.name ) {
                            reqField.found = 1;
                        }
                    });
                });

                angular.forEach(reqFields, function (reqField) {
                    if (reqField.found === 0) {
                        $scope.marketoStatus = 1;
                    }
                });
                callback(null, reqFields);
            }
        });
    }

    function saveAccountInternal(callback) {
        accountService.save($scope.account, function (err, account) {
            if (err) {
                err.stack_trace.unshift( { file: 'integration-controller.js', func: 'saveAccountInternal', message: 'Error saving account' } );
                errorService.save(err, function() {});
                callback(err, null);
            }
            else {
               callback(null, account);
            }
        });
    }

}]);

