/*
*   Workflow endpoints
*/

var model = require('../models/workflow-model');


/*
*   Saves a workflow
*/
exports.saveWorkflow = function(req, res, next) {
    model.saveWorkflow(req.body, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, item);
        }
    });
};

/*
*   Gets all workflows for an account
*/
exports.getByAccount = function(req, res, next) {
    model.getByAccount(req.params.accountId, function (err, items) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, items);
        }
    });
};

/*
*   Gets a workflow by id
*/
exports.getById = function(req, res, next) {
    model.getById(req.params.accountId, req.params.workflowId, function (err, items) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, items);
        }
    });
};