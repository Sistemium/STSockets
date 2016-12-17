'use strict';

const chai = require('chai');
const should = chai.should();
const app = require('../../app');
const request = require('supertest');

describe('GET /api/statuss', function () {

  it('should respond with JSON array', function (done) {
    request(app)
      .get('/api/statuss')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});
