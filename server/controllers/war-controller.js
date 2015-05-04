/*
*   War management endpoints
*/

var warModel  = require('../models/war-model'),
    userModel = require('../models/user-model');

/*
*   Gets active war for a clan
*/
exports.activeWar = function(req, res, next) {
    warModel.activeWar(req.params.clanId, function (err, clan) {
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


/*
*   Save a war
*/
exports.save = function(req, res, next) {
    warModel.save(req.body, function (err, war) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, war);
        }
    });
};

/*
*   Gets a war by id
*/
exports.getById = function(req, res, next) {
    warModel.findById(req.params.id, function (err, war) {
        if (err) {
            res.send(500, err);
        }
        else if (war) {
            res.json(200, war);
        }
        else {
            res.send(404, 'not found');
        }
    });
}

/*exports.allClans = function(req, res, next) {
    clanModel.allClans(req.params.query, function (err, clans) {
        if (err) {
            res.send(500, err);
        }
        else if (clans) {
            res.json(200, clans);
        }
        else {
            res.send(404, 'not found');
        }
    });
}*/



/*
*   Gets users by clan, optionally specify levels (member, elder, coleader, leader) comma separated
*   as a query string parameter, such as ?types=coleader,leader
*/
/*exports.getByClan = function(req, res, next) {
    if (req.query.types === 'all') {
        req.query.types = 'member,elder,coleader,leader';
    }
    userModel.usersByClan(req.params.clanId, req.query.types.split(','), function (err, users) {
        if (err) {
            res.send(500, err);
        }
        else if (users) {
            res.json(200, users);
        }
        else {
            res.send(404, 'not found');
        }
    });
}*/