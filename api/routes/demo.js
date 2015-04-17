/*
*   Endpoint for demo email
*/

var express = require('express'),
    _       = require('underscore');

var util      = require ('../../app/shared/util'),
    emailDemo = require ('../models/emaildemo-model');

var app = module.exports = express();

/*
*   Gets a demo email for a given demo address
*/
app.get('/v1/demo/:value', function (req, res, next) {
    emailDemo.findByAddress(req.params.value, function (err, email) {
        if (err || email == null) {
            res.json(200, null);
        }
        else {
            res.json(200, email);
        }
    });
});