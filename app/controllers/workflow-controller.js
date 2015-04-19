'use strict';

/*
*   Controller for the admin page
*/

angular.module('Clashtools.controllers')
.controller('WorkflowCtrl', ['$rootScope', '$scope', '$location', '$modal', 'authService', 'sessionService', 'errorService', 'workflowService', 'messagelogService', 'RESPONSE_TYPES',
function ($rootScope, $scope, $location, $modal, authService, sessionService, errorService, workflowService, messagelogService, RESPONSE_TYPES) {

    $rootScope.title = 'Siftrock - Workflows';
    $scope.helpLink = 'http://www.siftrock.com/help/';

    $scope.nullState = true;

    $scope.types = RESPONSE_TYPES;

    sessionService.getCurrentAccount(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'init', message: 'Error getting current account' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.account = account;
            workflowService.getByAccount(account._id, function (err, workflows) {
                if (err) {
                    err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'init', message: 'Error getting workflows' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.workflows = workflows;
                    if (workflows.length > 0) {
                        $scope.nullState = false;
                    }
                }
            });
        }
    });

    // handles display of helper at the top of the page
    sessionService.getUserSession(authService.user.id, function (err, session) {
        if (err) {
            err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'init', message: 'Error getting user session' } );
            errorService.save(err, function() {});
        }
        else {
            if (session.ui_flags.workflow_overview) {
                if (session.ui_flags.workflow_overview.open === false) {
                    $scope.workflowOverview = false;
                }
                else {
                    $scope.workflowOverview = true;
                }
            }
            else {
                $scope.workflowOverview = true;
                session.ui_flags.workflow_overview = { open: true };
                sessionService.saveUserSession(authService.user.id, session, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'init', message: 'Error saving user session' } );
                        errorService.save(err, function() {});
                    }
                });
            }

            $scope.userSession = session;
        }
    });

    $scope.config = function(hint) {
        $location.path('/settings/integration').search('hint', hint);
    }

    $scope.pause = function(workflow) {
        workflow.enabled = false;
        workflowService.save(workflow, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'pause', message: 'Error pausing workflow' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Workflow paused";

                messagelogService.save(
                    $scope.account._id,
                    'Paused workflow',
                    'action',
                    { new_value: workflow.friendly_name },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'workflow-controller.js', func: '$scope.pause', message: 'Error saving log message' } );
                            errorService.save(err, function() {});
                        }
                    }
                );
            }
        });
    }

    $scope.play = function(workflow) {
        workflow.enabled = true;
        workflowService.save(workflow, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'pause', message: 'Error enabling workflow' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Workflow enabled";

                messagelogService.save(
                    $scope.account._id,
                    'Enabled workflow',
                    'action',
                    { new_value: workflow.friendly_name },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'workflow-controller.js', func: '$scope.play', message: 'Error saving log message' } );
                            errorService.save(err, function() {});
                        }
                    }
                );
            }
        });
    }

    $scope.delete = function(workflow) {
        $scope.modalOptions = {
            title: 'Delete workflow',
            message: 'Are you sure you want to delete this workflow?',
            yesBtn: 'Delete',
            noBtn: 'Cancel',
            onYes: function() {
                workflow.enabled = false;
                workflow.deleted = true;
                workflowService.save(workflow, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'workflow-controller.js', func: 'pause', message: 'Error deleting workflow' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = "Workflow deleted";

                        // take care of null state if they deleted the last one
                        var anyActive = false;
                        angular.forEach($scope.workflows, function (workflow) {
                            if (!workflow.deleted) {
                                anyActive = true;
                            }
                        });

                        $scope.nullState = !anyActive;

                        messagelogService.save(
                            $scope.account._id,
                            'Deleted workflow',
                            'action',
                            { new_value: workflow.friendly_name },
                            function (err, res) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'workflow-controller.js', func: '$scope.delete', message: 'Error saving log message' } );
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

    $scope.newWorkflow = function(hint) {
        $location.path('/workflow/' + hint + '/new');
    }

    $scope.closeHelper = function() {
        $scope.userSession.ui_flags.workflow_overview.open = false;
        $scope.workflowOverview = false;

        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'workflow-controller.js', func: '$scope.CloseHelper', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
        });
    }
}]);
