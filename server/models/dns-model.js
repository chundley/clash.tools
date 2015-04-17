/*
*   API for DNS resolution
*/

var dns = require('dns');

/*
* Gets MX records associated with a domain
*/
exports.getMXRecords = function(domain, callback) {
    dns.resolveMx(domain, function (err, addresses) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, addresses);
        }
    });
}
