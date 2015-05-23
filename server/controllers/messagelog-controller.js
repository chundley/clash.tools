/*
*   Message log endpoints
*/

var messagelogModel = require('../models/messagelog-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    messagelogModel.save(req.body, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            socket.emit('messagelog:change', null);
            res.json(200, message);
        }
    });
};

/*
*   Get last N messages - query string parameter = count
*/
exports.get = function(req, res, next) {
    messagelogModel.get(req.params.clanId, req.query.count, function (err, messages) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, messages);
        }
    });
};
