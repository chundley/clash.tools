/*
*   Player note endpoints
*/

var playerNotesModel = require('../models/playernotes-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    playerNotesModel.save(req.body, function (err, note) {
        if (err) {
            res.send(500, err);
        }
        else {
            //socket.emit('messagelog:' + req.body.clan_id + ':change', null);
            res.json(200, note);
        }
    });
};

/*
*   Get player notes
*/
exports.get = function(req, res, next) {
    playerNotesModel.get(req.params.userId, req.params.clanId, function (err, notes) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, notes);
        }
    });
};

/*
*   Get player notes
*/
exports.delete = function(req, res, next) {
    playerNotesModel.delete(req.params.noteId, function (err, notes) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, 'Success');
        }
    });
};