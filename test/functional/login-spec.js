/*
*   Functional tests for blah
*/


var Browser = require('zombie'),
    expect  = require('expect'),
    log4js  = require('log4js'),
    http    = require('http');

var App          = require('../../app/app'),
    config       = require('../../config/config'),
    mongoCache   = require('../../app/shared/mongo-cache'),

/*
*   TODO: eventually make a test environment
*/
process.env.NODE_ENV = 'development';

/*
*   Suspend logging during functional testing by initializing with a null logger
*/
logger = log4js.getLogger(null);
logger.setLevel('off');

/*
* Global connection manager for MongoDB
*/
db = mongoCache();

/*
*   The express app
*/
var app = new App();

// all routes configured in routes.js
require('../../server/routes.js')(app.theApp());


/*
*   Test the log in process
*/
describe('Log in process', function() {

    // timeout includes the time to spin up the server
    this.timeout(8000);

    // start the app and zombie browser
    before(function (done) {
        var me = this;
        this.server =
            http.createServer(app.theApp()).listen(
                config.env[process.env.NODE_ENV].url.port,
                config.env[process.env.NODE_ENV].url.host,
                function () {
                    me.browser =  new Browser({site: 'http://localhost:7993', debug: true});
                    done();
                });
    });

    it('Login page loads', function(done) {
        var browser = this.browser;
        browser.visit('/login', function () {
            expect(browser.success).toBe(true);
            expect(browser.query('input[name=emailAddress][type=email]')).toExist();
            expect(browser.query('input[name=password][type=password]')).toExist();
            done();
        });
    });

    it('Register page loads', function(done) {
        var browser = this.browser;
        browser.visit('/register', function () {
            expect(browser.success).toBe(true);
            expect(browser.query('input[name=name][type=text]')).toExist();
            expect(browser.query('input[name=company][type=text]')).toExist();
            expect(browser.query('input[name=emailAddress][type=email]')).toExist();
            expect(browser.query('input[name=password][type=password]')).toExist();
            done();
        });
    });

    after(function (done) {
        this.server.close(done);
    });
});
