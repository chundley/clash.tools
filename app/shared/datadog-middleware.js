var dogstatsd = require("node-dogstatsd").StatsD;

module.exports.ddLog = function (options) {
    var dataDog = options.dogstatsd || new dogstatsd();
    var stat = options.stat || "app.request";
    var tags = options.tags || [];
    var path = options.path || false;

    return function (req, res, next) {
        if (!req._startTime) {
            req._startTime = new Date();
        }

        var end = res.end;
        res.end = function (chunk, encoding) {
            res.end = end;
            res.end(chunk, encoding);

            if (!req.route || !req.route.path) {
                return;
            }

            var statTags = [
                "route:" + req.route.path
            ].concat(tags);

            if (options.method) {
                statTags.push("method:" + req.method.toLowerCase());
            }

            if (options.protocol && req.protocol) {
                statTags.push("protocol:" + req.protocol);
            }

            if (path !== false) {
                statTags.push("path:" + req.path);
            }

            statTags.push("response_code:" + res.statusCode);
            dataDog.increment(stat + '.response' , 1, statTags);
            dataDog.histogram(stat + '.response_time', (new Date() - req._startTime), 1, statTags);
        };

        next();
    };
};