/*
*   Arranged war endpoints
*/

var arrangedWarModel = require('../models/arrangedwar-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    arrangedWarModel.save(req.body, function (err, model) {
        if (err) {
            res.send(500, err);
        }
        else {
            var retData = null;
            if (req.params.clanId == model.clan_1.clan_id) {
                retData = model.clan_1;
            }

            else {
                retData = model.clan_2;
            }
            socket.emit('arrangedwar:' + model._id + ':' + retData.clan_id + ':change', retData);
            res.json(200, { result: 'success'} );
        }
    });
};

/*
*   Get by Id
*/
exports.getById = function(req, res, next) {
    arrangedWarModel.getById(req.params.id, function (err, war) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, war);
        }
    });
};

/*
*   Get arranged war list
*/
exports.getByClanId = function(req, res, next) {
    arrangedWarModel.getByClanId(req.params.clanId, function (err, list) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, list);
        }
    });
};

/*
*   Delete an arranged war
*/
exports.delete = function(req, res, next) {
    arrangedWarModel.delete(req.params.id, req.body, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, 'Success');
        }
    });
};