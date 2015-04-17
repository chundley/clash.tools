var should = require('should');

var util = require('../../app/shared/util');


describe('Shared utils', function() {
    describe('isNumber', function() {
        it('valid positive integer', function (done) {
            var isValid = util.isNumber(5);
            isValid.should.equal(true);
            done();
        });

        it('valid positive float', function (done) {
            var isValid = util.isNumber(8.46);
            isValid.should.equal(true);
            done();
        });

        it('valid nagative integer', function (done) {
            var isValid = util.isNumber(-7);
            isValid.should.equal(true);
            done();
        });

        it('valid nagative float', function (done) {
            var isValid = util.isNumber(-.64);
            isValid.should.equal(true);
            done();
        });

        it('invalid string: x54', function (done) {
            var isValid = util.isNumber("x54");
            isValid.should.equal(false);
            done();
        });

        it('invalid string: 100z', function (done) {
            var isValid = util.isNumber("100z");
            isValid.should.equal(false);
            done();
        });

        it('invalid object', function (done) {
            var isValid = util.isNumber(util);
            isValid.should.equal(false);
            done();
        });
    });
});
