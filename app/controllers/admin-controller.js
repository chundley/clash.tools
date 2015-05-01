'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('AdminCtrl', ['$rootScope', '$scope', '$location', 'userService', 'nlpConfigService', 'authService', 'sessionService', 'errorService',
function ($rootScope, $scope, $location, userService, nlpConfigService, authService, sessionService, errorService) {

    $rootScope.title = "Siftrock - Admin";
    $scope.activeTab = 'accounts';
    $scope.activeSubTab = 'bounce';

    sessionService.getCurrentAccount(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'admin-controller.js', func: 'init', message: 'Error getting current account' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.accountId = account._id;
        }
    });

    accountService.adminAllAccounts(function (err, accounts) {
        if (err) {
            err.stack_trace.unshift( { file: 'admin-controller.js', func: 'init', message: 'Error getting accounts' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.accounts = accounts;
        }
    });

    nlpConfigService.get(function (err, nlpConf) {
        if (err) {
            err.stack_trace.unshift( { file: 'admin-controller.js', func: 'init', message: 'Error getting NLP config' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.nlpConfig = nlpConf;

            // need space in the model for new values
            $scope.newTypes = {};
            angular.forEach($scope.nlpConfig.messageType, function (type, value) {
                $scope.newTypes[value] = { newTerm: null, newWeight: null } ;
            });
        }
    });

    $scope.activateTab = function(type) {
        $scope.activeSubTab = type;
    }

    $scope.spoofAccount = function(userId) {
        userService.getById(userId, function (err, user) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.spoofAccount', message: 'Error getting user to spoof' } );
                errorService.save(err, function() {});
            }
            else {
                var spoofUser = {
                    id: user._id,
                    email: user.email_address,
                    role: { bitMask: 8, title: 'sadmin' } //user.role
                };
                authService.spoofUser(spoofUser, function () {
                    $location.path('/').replace();
                });
            }
        });
    }

    $scope.addSubjectCruft = function() {
        // make sure it's not a duplicate first
        var found = false;
        angular.forEach($scope.nlpConfig.subjectCruft, function (val) {
            if (val === $scope.newSubjectCruftVal) {
                found = true;
            }
        });
        if (!found) {
            $scope.nlpConfig.subjectCruft.push($scope.newSubjectCruftVal);
            saveNLPConfig($scope.nlpConfig, function (err) {
                if (err) {
                    err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.addSubjectCruft', message: 'Error saving NLP config' } );
                    errorService.save(err, function() {});
                }
                else {
                    $rootScope.globalMessage = "New subject cruft value saved";
                    $scope.newSubjectCruftVal = '';
                }
            });
        }
    }

    $scope.removeSubjectCruft = function(term) {
        $scope.nlpConfig.subjectCruft.splice($scope.nlpConfig.subjectCruft.indexOf(term), 1);
        saveNLPConfig($scope.nlpConfig, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.removeSubjectCruft', message: 'Error saving NLP config' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Subject cruft value removed";
            }
        });
    }

    $scope.addFooterCruft = function() {
        // make sure it's not a duplicate first
        var found = false;
        angular.forEach($scope.nlpConfig.footerCruft, function (val) {
            if (val === $scope.newFooterCruftVal) {
                found = true;
            }
        });
        if (!found) {
            $scope.nlpConfig.footerCruft.push($scope.newFooterCruftVal);
            saveNLPConfig($scope.nlpConfig, function (err) {
                if (err) {
                    err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.addFooterCruft', message: 'Error saving NLP config' } );
                    errorService.save(err, function() {});
                }
                else {
                    $rootScope.globalMessage = "New footer cruft value saved";
                    $scope.newFooterCruftVal = '';
                }
            });
        }
    }

    $scope.removeFooterCruft = function(term) {
        $scope.nlpConfig.footerCruft.splice($scope.nlpConfig.footerCruft.indexOf(term), 1);
        saveNLPConfig($scope.nlpConfig, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.removeFooterCruft', message: 'Error saving NLP config' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Subject cruft value removed";
            }
        });
    }

    $scope.addPhoneRegex = function() {
        // make sure neither the country nor regex is already used
        var found = false;
        angular.forEach($scope.nlpConfig.phoneNumberRegex, function (val) {
            if (val.country == $scope.newPhoneRegexCountry || val.regex == $scope.newPhoneRegexValue) {
                found = true;
            }
        });

        if (!found) {
            $scope.nlpConfig.phoneNumberRegex.push(
                {
                    country: $scope.newPhoneRegexCountry,
                    regex: $scope.newPhoneRegexValue
                }
            );

            saveNLPConfig($scope.nlpConfig, function (err) {
                if (err) {
                    err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.addPhoneRegex', message: 'Error saving NLP config' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.newPhoneRegexCountry = '';
                    $scope.newPhoneRegexValue = '';
                    $rootScope.globalMessage = "Phone number regex added";
                }
            });
        }
    }

    $scope.removePhoneRegex = function(country) {
        for (var idx=0; idx<$scope.nlpConfig.phoneNumberRegex.length; idx++) {
            if ($scope.nlpConfig.phoneNumberRegex[idx].country == country) {
                $scope.nlpConfig.phoneNumberRegex.splice(idx, 1);
                break;
            }
        }

        saveNLPConfig($scope.nlpConfig, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.removePhoneRegex', message: 'Error saving NLP config' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Phone number regex removed";
            }
        });

    }

    $scope.addTypeTerm = function(type) {
        // make sure it's not a duplicate first
        var found = false;
        angular.forEach($scope.nlpConfig.messageType[type], function (val) {
            if (val.term === $scope.newTypes[type].newTerm) {
                found = true;
            }
        });
        if (!found) {
            $scope.nlpConfig.messageType[type].push(
                {
                    term: $scope.newTypes[type].newTerm,
                    weight: $scope.newTypes[type].newWeight,
                    added: new Date()
                }
            );
            saveNLPConfig($scope.nlpConfig, function (err) {
                if (err) {
                    err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.addTypeTerm', message: 'Error saving NLP config' } );
                    errorService.save(err, function() {});
                }
                else {
                    $rootScope.globalMessage = "New term saved";
                    $scope.newTypes[type].newTerm = null;
                    $scope.newTypes[type].newWeight = null;
                }
            });
        }
    }

    $scope.removeTypeTerm = function(type, term) {
        for (var idx=0; idx<$scope.nlpConfig.messageType[type].length; idx++) {
            if ($scope.nlpConfig.messageType[type][idx].term == term) {
                $scope.nlpConfig.messageType[type].splice(idx, 1);
                break;
            }
        }

        saveNLPConfig($scope.nlpConfig, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: '$scope.removeTypeTerm', message: 'Error saving NLP config' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Term removed";
            }
        });
    }

    function saveNLPConfig(nlpConf, callback) {
        nlpConf.subjectCruft.sort();
        nlpConf.footerCruft.sort();

        var sortTypes = function (a, b) {
            if (a.weight == b.weight) {
                if (a.term > b.term) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
            else {
                if (a.weight > b.weight) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        };

        // sort terms by weight and term before saving
        angular.forEach(nlpConf.messageType, function (type, value) {
            nlpConf.messageType[value].sort(sortTypes);
        });

        nlpConfigService.save(nlpConf, function (err, conf) {
            if (err) {
                err.stack_trace.unshift( { file: 'admin-controller.js', func: 'saveNLPConfig', message: 'Error saving NLP config' } );
                callback(err);
            }
            else {
                callback();
            }
        });
    }

}]);