/*
*   Clan management endpoints
*/

var clanModel = require('../models/clan-model'),
    userModel = require('../models/user-model');

/*
*   Save a clan
*/
exports.save = function(req, res, next) {
    clanModel.save(req.body, function (err, clan) {
        if (err) {
            if (err.indexOf('exists')) {
                res.json(403, clan);
            }
            res.send(500, err);
        }
        else {
            userModel.updateClan(clan.created_by, clan, function (err, result) {
                if (err) {
                    // TODO: Ugly, ugly problem here
                }
            });
            res.json(200, clan);
        }
    });
};

exports.getById = function(req, res, next) {
    clanModel.findById(req.params.id, function (err, clan) {
        if (err) {
            res.send(500, err);
        }
        else if (clan) {
            res.json(200, clan);
        }
        else {
            res.send(404, 'not found');
        }
    });
}
