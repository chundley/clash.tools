'use strict';

/*
*   Controller for the Marketo workflow page
*/

angular.module('SiftrockApp.controllers')
.controller('HubspotCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'hubspotService', 'workflowService', 'messagelogService', 'RESPONSE_TYPES', 'SIFTROCK_FIELDS',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, errorService, hubspotService, workflowService, messagelogService, RESPONSE_TYPES, SIFTROCK_FIELDS) {

    $rootScope.title = 'Siftrock - Workflow Detail';
    $scope.helpLink = 'http://www.siftrock.com/help/integration-workflows/';

    $scope.errorMsg = '';

    $scope.workflowState = {
        sourceData: '',
        stepOne: false,
        stepTwo: false,
        stepThree: false,
        addToList: false,
        updateFields: false,
        validWorkflow: false
    };

    $scope.types = RESPONSE_TYPES;
    $scope.siftrockFields = SIFTROCK_FIELDS;

    $scope.partner = 'hubspot';

    $scope.actionGroups = {};
    $scope.actionGroups['hubspot'] = {
        groupName: 'Hubspot',
        actions: [
            { id: 'add-to-list', description: 'Add contacts to a list'},
            { id: 'update-fields', description: 'Update lead fields'},
            { id: 'add-and-update', description: 'Add contacts to a list AND update lead fields'}
        ]
    };

    sessionService.getCurrentAccount(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'hubspot-controller.js', func: 'init', message: 'Error getting current account' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.account = account;
            if ($routeParams.id === 'new') {
                $scope.workflow = {
                    account_id: account._id,
                    type: 'integration',
                    partner: $scope.partner,
                    trigger: {},
                    action: {
                        meta: {
                            list: {},
                            fields: [],
                            filters: []
                        }
                    },
                    enabled: true,
                    deleted: false
                };
            }
            else {
                workflowService.getById(account._id, $routeParams.id, function (err, workflow) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'hubspot-controller.js', func: 'init', message: 'Error getting existing workflow' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $scope.workflow = workflow;
                        setInitialState();
                    }
                });
            }

        }
    });

    $scope.changeType = function(type) {
        $scope.workflow.trigger.type = type;
        $scope.workflowState.stepOne = true;
    }

    $scope.changeTypeField = function() {
        if ($scope.workflow.trigger.data == 'recipient') {
            $scope.workflowState.sourceData = 'original recipient';
        }
        else {
            $scope.workflowState.sourceData = 'new contact records';
        }
        $scope.workflowState.stepTwo = true;
    }

    /*
    *   Reset state on action change to render controls correctly
    */
    $scope.changeAction = function(action) {

        $scope.workflow.action.id = action.id;
        $scope.workflow.action.description = action.description;

        $scope.workflowState.stepThree = false;
        $scope.workflowState.addToList = false;
        $scope.workflowState.updateFields = false;

        if (action.id === 'add-to-list') {
            $scope.workflowState.addToList = true;
        }
        else if (action.id === 'update-fields') {
            $scope.workflowState.updateFields = true;
        }
        else {
            $scope.workflowState.addToList = true;
            $scope.workflowState.updateFields = true;
        }

        // only pull lists if they haven't already been pulled
        if ($scope.workflowState.addToList && !$scope.lists) {
            hubspotService.getLists($scope.account._id, function (err, lists) {
                $scope.lists = lists;
            });
        }

        // only pull fields if they haven't already been pulled
        if ($scope.workflowState.updateFields && !$scope.fields) {
            // make sure a dropdown appears
            if ($scope.workflow.action.meta.fields.length == 0) {
                $scope.workflow.action.meta.fields.push({});
            }

            hubspotService.getFields($scope.account._id, function (err, fields) {
                $scope.fields = filterFields(fields);
            });
        }
        fullValidation();
    }

    $scope.changeList = function(list) {
        $scope.workflow.action.meta.list = {
            id: list.id,
            name: list.name
        };

        fullValidation();
    }

    $scope.changeField = function(workflowFieldIndex, field) {

        // before adding, make sure this field isn't already being used
        var used = false;
        angular.forEach($scope.workflow.action.meta.fields, function (f) {
            if (f.id == field.id) {
                used = true;
            }
        });

        if (!used) {
            $scope.workflow.action.meta.fields[workflowFieldIndex] = {
                id: field.id,
                name: field.name,
                description: field.description,
                type: field.type,
                value: null
            };
        }
        fullValidation();
    }

    $scope.addField = function() {
        $scope.workflow.action.meta.fields.push({});
        fullValidation();
    }

    $scope.removeField = function(index) {
        $scope.workflow.action.meta.fields.splice(index, 1);
        fullValidation();
    }

    $scope.changeFieldValue = function(workflowFieldIndex, value) {
        $scope.workflow.action.meta.fields[workflowFieldIndex].value = value;
        fullValidation();
    }

    $scope.changeFilterField = function(workflowFilterIndex, field) {
        $scope.workflow.action.meta.filters[workflowFilterIndex] = {
            name: field.fieldName,
            description: field.description,
            value: null
        };

        fullValidation();
    }

    $scope.addFilter = function() {
        $scope.workflow.action.meta.filters.push({});
        fullValidation();
    }

    $scope.removeFilter = function(index) {
        $scope.workflow.action.meta.filters.splice(index, 1);
        fullValidation();
    }

    $scope.changeFilterValue = function(workflowFilterIndex, value) {
        $scope.workflow.action.meta.filters[workflowFilterIndex].value = value;
        fullValidation();
    }

    $scope.saveWorkflow = function() {
        // clean up excess meta data
        if ($scope.workflow.action.id === 'add-to-list') {
            $scope.workflow.action.meta.fields = [];
        }
        if ($scope.workflow.action.id === 'update-fields') {
            $scope.workflow.action.meta.list = {};
        }

        var msg = 'Created new workflow';
        if ($scope.workflow._id) {
            msg = 'Updated workflow';
        }

        workflowService.save($scope.workflow, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'hubspot-controller.js', func: 'saveWorkflow', message: 'Error saving workflow' } );
                errorService.save(err, function() {});
            }
            else {
                messagelogService.save(
                    $scope.account._id,
                    msg,
                    'action',
                    { new_value: result.friendly_name },
                    function (err, res) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'hubspot-controller.js', func: '$scope.saveWorkflow', message: 'Error saving log message' } );
                            errorService.save(err, function() {});
                        }
                    }
                );

                $location.path('/workflow');
            }
        });
    }


    /*
    *   Step 3 has some complex validation rules. Set workflowState.stepThree based on validation here
    */
    function step3Validation() {
        var valid = true;
        if ($scope.workflow.action.id === 'add-to-list') {
            if (!$scope.workflow.action.meta.list.id) {
                valid = false;
            }
        }

        else if ($scope.workflow.action.id === 'update-fields') {
            // check each field for valid key/value
            angular.forEach($scope.workflow.action.meta.fields, function (field) {
                if (!field.id || !field.value || field.value.length == 0) {
                    valid = false;
                }
            });

            // covers the case where all fields have been removed
            if ($scope.workflow.action.meta.fields.length == 0) {
                valid = false;
            }
        }

        else { // add to list and update fields case
            if (!$scope.workflow.action.meta.list.id) {
                valid = false;
            }

            angular.forEach($scope.workflow.action.meta.fields, function (field) {
                if (!(field.id && field.value && field.value.length > 0)) {
                    valid = false;
                }
            });

            // covers the case where all fields have been removed
            if ($scope.workflow.action.meta.fields.length == 0) {
                valid = false;
            }
        }

        $scope.workflowState.stepThree = valid;
    }

    function fullValidation() {
        var valid = true;
        step3Validation();
        if (!$scope.workflowState.stepThree) {
            valid = false;
        }

        angular.forEach($scope.workflow.action.meta.filters, function (filter) {
            if (!(filter.name && filter.value && filter.value.length > 0)) {
                valid = false;
            }
        });

        $scope.workflowState.validWorkflow = valid;
    }

    /*
    *   Sets initial state of the view when an existing workflow is loaded
    */
    function setInitialState() {
        hubspotService.getLists($scope.account._id, function (err, lists) {
            $scope.lists = lists;
        });

        hubspotService.getFields($scope.account._id, function (err, fields) {
            $scope.fields = filterFields(fields);
        });

        $scope.workflowState.stepOne = true;
        $scope.workflowState.stepTwo = true;
        $scope.workflowState.stepThree = true;

        $scope.changeTypeField();

        if ($scope.workflow.action.id === 'add-to-list') {
            $scope.workflowState.addToList = true;
        }
        else if ($scope.workflow.action.id === 'update-fields') {
            $scope.workflowState.updateFields = true;
        }
        else {
            $scope.workflowState.addToList = true;
            $scope.workflowState.updateFields = true;
        }

        $scope.workflowState.validWorkflow = true;
    }

    /*
    *   Some of the fields in Hubspot are only updated by the Siftrock jobs service - don't make them
    *   available to the UI
    */
    function filterFields(hubspotFields) {
        var reqFields = [
            'siftrock_created',
            'siftrock_reply_type',
            'siftrock_url'
        ];

        angular.forEach(hubspotFields, function (hubspotField) {
            var found = false;
            angular.forEach(reqFields, function (reqField) {
                if (reqField === hubspotField.name) {
                    found = true;
                }
            });

            if (found) {
                hubspotField.visible = false;
            }
            else {
                hubspotField.visible = true;
            }
        });
        return hubspotFields;
    }

}]);
