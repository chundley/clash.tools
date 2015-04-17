'use strict';

/*
*   Controller for the settings page of the application
*/

angular.module('SiftrockApp.controllers')
.controller('SettingsCtrl', ['$rootScope', '$scope', '$location', '$modal', 'md5', 'authService', 'sessionService', 'accountService', 'userService', 'mailService', 'dnsService', 'errorService', 'utils', 'messagelogService',
function ($rootScope, $scope, $location, $modal, md5, authService, sessionService, accountService, userService, mailService, dnsService, errorService, utils, messagelogService) {

    $rootScope.title = "Siftrock - Settings";
    $scope.helpLink = 'http://www.siftrock.com/help/';

    $scope.activeTab = 'profile';

    $scope.verifyMessage = false;

    // Status codes
    //   0: not tested, not running
    //   1: test running
    //   2: test run, failed
    //   3: test run, success
    //   99: no domain to test
    $scope.mxTestingStatus = 0;

    sessionService.getUserSession(authService.user.id, function (err, session) {
        if (err) {
            err.stack_trace.unshift( { file: 'settings-controller.js', func: 'init', message: 'Error getting user session' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.userSession = session;
            if (session.settings_tab == 'integration') {
                $location.path('/settings/integration');
            }
            else {
                $scope.activeTab = session.settings_tab;
            }
        }
    });

    accountService.getByUserId(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'settings-controller.js', func: 'init', message: 'Error getting account' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.account = account;
            $scope.system_email = account.reply_domain;
            if (account.reply_domain.length == 0) {
                $scope.mxTestingStatus = 99;
            }

            loadUsersInternal();
        }
    });

    userService.getById(authService.user.id, function (err, user) {
        if (err) {
            err.stack_trace.unshift( { file: 'settings-controller.js', func: 'init', message: 'Error getting user' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.user = user;
            $scope.oldEmail = user.email_address;
            if (!user.verified) {
                $scope.verifyMessage = true;
            }
        }
    });

    $scope.changeTab = function(tab) {
        $scope.activeTab = tab;
        $scope.userSession.settings_tab = tab;
        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, session) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: 'changeTab', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
        });
    }

    $scope.saveAccount = function() {
        saveAccountInternal('Account saved');
    }

    $scope.changeReplyTo = function() {
        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            formData: {
                domain: $scope.account.reply_domain,
                error: ''
            },
            error: '',
            onYes: function(formdata) {
                // save in case we need to revert
                var oldVal = $scope.account.reply_domain;

                $scope.account.reply_domain = formdata.domain;
                saveAccountChangedReplyTo('Reply-to domain changed to "' + formdata.domain, function (changed) {
                    if (changed) {
                        modalInstance.hide();
                        $scope.testMx();

                        messagelogService.save(
                            $scope.account._id,
                            'Changed reply-to domain',
                            'action',
                            { new_value: $scope.account.reply_domain },
                            function (err, res) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.changeReplyTo', message: 'Error saving log message' } );
                                    errorService.save(err, function() {});
                                }
                            }
                        );
                    }
                    else {
                        formdata.error = 'Invalid domain: already in use by another account';
                        $scope.account.reply_domain = oldVal;
                    }
                });
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/replyToDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.testMx = function() {
        $scope.mxTestingStatus = 1;
        $scope.account.mx_verified = false;
        var domain = $scope.account.reply_domain;
        dnsService.mxRecords($scope.account.reply_domain, function (err, result) {
            if (err || result.records === undefined || result.records.length == 0) {
                // no mx records for this domain
                $scope.mxInvalidMessage = 'No MX record found for domain ' + domain;
                $scope.mxInvalidHelp = "http://www.siftrock.com/help/no-mx-record/";
                $scope.account.mx_verified = false;
            }
            else {
                $scope.mxRecords = result.records;

                // first, find the highest priority MX server
                var highestPriority = 10000;
                var highestPriorityExchange = '';
                for (var idx=0; idx<result.records.length; idx++) {
                    if (result.records[idx].priority < highestPriority) {
                        highestPriority = result.records[idx].priority;
                        highestPriorityExchange = result.records[idx].exchange;
                    }
                }

                // verify that the siftrock mail server is set as highest priority
                if (highestPriorityExchange == result.mx_config) {
                    $scope.account.mx_verified = true;
                }
                else {
                    $scope.mxInvalidMessage = 'MX record for ' + domain + ' is not configured correctly';
                    $scope.mxInvalidHelp = "http://www.siftrock.com/help/bad-mx-record/";
                    $scope.account.mx_verified = false;
                    $scope.mxTestingStatus = 2;
                }
            }
            if ($scope.account.mx_verified) {
                $scope.mxTestingStatus = 3;
            }
            else {
                $scope.mxTestingStatus = 2;
            }
            saveAccountInternal();
        });
    }

    $scope.addDomain = function() {
        $scope.modalOptions = {
            yesBtn: 'Add Domain',
            noBtn: 'Cancel',
            formData: {
                domain: null
            },
            onYes: function(formdata) {
                $scope.account.ignore_domains.push(
                    formdata.domain
                );

                saveAccountInternal('Domain "' + formdata.domain +  '" added to ignore list');

                messagelogService.save(
                    $scope.account._id,
                    'Added a domain to ignore list',
                    'action',
                    { new_value: formdata.domain },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.addDomain', message: 'Error saving log message' } );
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
                template: "/views/partials/ignoreDomainDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.removeDomain = function(domain) {
        for (var idx=0; idx<$scope.account.ignore_domains.length; idx++) {
            if ($scope.account.ignore_domains[idx] == domain) {
                $scope.account.ignore_domains.splice(idx, 1);
                break;
            }
        }
        saveAccountInternal('Domain ' + domain + ' was removed from ignore list');

        messagelogService.save(
            $scope.account._id,
            'Removed a domain from ignore list',
            'action',
            { new_value: domain },
            function (err, res) {
                if (err) {
                    err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.addDomain', message: 'Error saving log message' } );
                    errorService.save(err, function() {});
                }
            }
        );
    }

    $scope.addHuman = function() {
        $scope.modalOptions = {
            yesBtn: 'Add Address',
            noBtn: 'Cancel',
            formData: {
                email_address: null
            },
            onYes: function(formdata) {
                var found = false;
                for (var idx=0; idx<$scope.account.forwards.human.length; idx++) {
                    if ($scope.account.forwards.human[idx] == formdata.email_address) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.account.forwards.human.push(
                        formdata.email_address
                    );
                    saveAccountInternal(formdata.email_address +  '" added to human forward list');

                    messagelogService.save(
                        $scope.account._id,
                        'Added human forwarding address',
                        'action',
                        { new_value: formdata.email_address },
                        function (err, res) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.addUnknown', message: 'Error saving log message' } );
                                errorService.save(err, function() {});
                            }
                        }
                    );
                }
                else {
                    $rootScope.globalMessage = "Email address is already in the list";
                }
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/forwardHumanDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });

    }

    $scope.removeHuman = function(address) {
        for (var idx=0; idx<$scope.account.forwards.human.length; idx++) {
            if ($scope.account.forwards.human[idx] == address) {
                $scope.account.forwards.human.splice(idx, 1);
                break;
            }
        }
        saveAccountInternal(address + ' was removed from unclassified forward list');

        messagelogService.save(
            $scope.account._id,
            'Removed human forwarding address',
            'action',
            { new_value: address },
            function (err, res) {
                if (err) {
                    err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.removeUnknown', message: 'Error saving log message' } );
                    errorService.save(err, function() {});
                }
            }
        );
    }

    $scope.addAll = function() {
        $scope.modalOptions = {
            yesBtn: 'Add Address',
            noBtn: 'Cancel',
            formData: {
                email_address: null
            },
            onYes: function(formdata) {
                var found = false;
                for (var idx=0; idx<$scope.account.forwards.all.length; idx++) {
                    if ($scope.account.forwards.all[idx] == formdata.email_address) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.account.forwards.all.push(
                        formdata.email_address
                    );
                    saveAccountInternal(formdata.email_address +  '" added to all replies forward list');

                    messagelogService.save(
                        $scope.account._id,
                        'Added all email forwarding address',
                        'action',
                        { new_value: formdata.email_address },
                        function (err, res) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.addAll', message: 'Error saving log message' } );
                                errorService.save(err, function() {});
                            }
                        }
                    );
                }
                else {
                    $rootScope.globalMessage = "Email address is already in the list";
                }
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/forwardAllDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });

    }

    $scope.removeAll = function(address) {
        for (var idx=0; idx<$scope.account.forwards.all.length; idx++) {
            if ($scope.account.forwards.all[idx] == address) {
                $scope.account.forwards.all.splice(idx, 1);
                break;
            }
        }
        saveAccountInternal(address + ' was removed from all replies forward list');

        messagelogService.save(
            $scope.account._id,
            'Removed all email forwarding address',
            'action',
            { new_value: address },
            function (err, res) {
                if (err) {
                    err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.removeAll', message: 'Error saving log message' } );
                    errorService.save(err, function() {});
                }
            }
        );
    }

    $scope.saveUser = function() {
        // if email was changed the account needs to be re-verified
        var emailChanged = false;
        if ($scope.user.email_address != $scope.oldEmail) {
            $scope.user.verified = false;
            emailChanged = true;
        }
        userService.update($scope.user._id, $scope.user, function (err, u) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.saveUser', message: 'Error saving user' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.user = u;
                $scope.oldEmail = u.email_address;

                if (emailChanged) {
                    // send a verify email
                    mailService.verifyEmail($scope.user._id, function (err, result) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.saveUser', message: 'Error sending verify mail' } );
                            errorService.save(err, function() {});
                        }
                    });
                }
                $rootScope.globalMessage = 'Profile settings saved';
            }
        });
    }

    $scope.sendVerifyEmail = function() {
        // send a verify email
        mailService.verifyEmail($scope.user._id, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.sendVerifyEmail', message: 'Error sending verify mail' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = 'Email verification sent';
            }
        });
    }

    $scope.savePassword = function() {
        userService.changePassword($scope.user._id, md5.createHash($scope.pw1), function (err, data) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.savePassword', message: 'Error saving password' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.pw1 = '';
                $scope.pw2 = '';
                $rootScope.globalMessage = 'Password changed';
            }
        });
    }

    $scope.addUser = function() {
        $scope.modalOptions = {
            yesBtn: 'Add User',
            noBtn: 'Cancel',
            formData: {
                role: 'User'
            },
            onYes: function(formdata) {
                var tempPW = utils.randString(8);
                var newUser = {
                    created_by: $scope.user._id,
                    name: formdata.name,
                    email_address: formdata.email_address,
                    nickname: formdata.email_address.substring(0, formdata.email_address.indexOf('@')),
                    temp_password: tempPW,
                    password: md5.createHash(tempPW),
                    role: formdata.role == 'User' ? authService.userRoles.user : authService.userRoles.admin,
                    verified: true
                };

                accountService.addUser($scope.account._id, newUser, function (err, res) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'settings-controller.js', func: 'addUser', message: 'Error adding user' } );
                        errorService.save(err, function() {});
                    }
                    else if (res) {
                        modalInstance.hide();
                        $rootScope.globalMessage = 'New user added';
                        loadUsersInternal();

                        messagelogService.save(
                            $scope.account._id,
                            'Added a user to the account',
                            'action',
                            { new_value: formdata.email_address },
                            function (err, res) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.addUser', message: 'Error saving log message' } );
                                    errorService.save(err, function() {});
                                }
                            }
                        );
                    }
                    else {
                        // the service returns null if the user already exists
                        formdata.error = 'A user with this email address already exists in the system';
                    }
                });
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/addUserDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.disableUser = function(id, name, email_address) {
        if (id == authService.user.id) {
            // can't delete yourself
        }
        else {
            $scope.modalOptions = {
                title: 'Disable user',
                message: 'Are you sure you want to disable "' + name + '"?',
                yesBtn: 'Disable',
                noBtn: 'Cancel',
                onYes: function(mod) {
                    userService.disable(id, function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.disableUser', message: 'Error disabling a user' } );
                            errorService.save(err, function() {});
                        }
                        else {
                            $rootScope.globalMessage = 'User disabled';
                            loadUsersInternal();

                            messagelogService.save(
                                $scope.account._id,
                                'Disabled user',
                                'action',
                                { new_value: email_address },
                                function (err, res) {
                                    if (err) {
                                        err.stack_trace.unshift( { file: 'settings-controller.js', func: '$scope.disableUser', message: 'Error saving log message' } );
                                        errorService.save(err, function() {});
                                    }
                                }
                            );
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
    }

    function loadUsersInternal() {
        accountService.getUsers($scope.account._id, function (err, users) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: 'loadUsersInternal', message: 'Error getting account users' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.users = users;
            }
        });
    }

    function saveAccountInternal(message) {
        accountService.save($scope.account, function (err, account) {
            if (err) {
                err.stack_trace.unshift( { file: 'settings-controller.js', func: 'saveAccountInternal', message: 'Error saving account' } );
                errorService.save(err, function() {});
            }
            else if (message) {
               // $rootScope.globalMessage = message;
            }
        });
    }

    /*
    *   Special handling of reply-to changing
    *
    *   Assume if an error happens it's because the domain is already in use. In the future
    *   this should probably be a separate endpoint all the way through
    */
    function saveAccountChangedReplyTo(message, callback) {
        accountService.save($scope.account, function (err, account) {
            if (err) {
                callback(false);
            }
            else {
                $rootScope.globalMessage = message;
                callback(true);
            }
        });
    }

}]);