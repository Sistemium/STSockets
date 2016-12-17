'use strict';
let request = require('supertest');
let chai = require('chai');
let app = require('../../app');

describe('GET api/jsData', function () {

  it('should check if authorized in redis', function (done) {
    request(app)
      .get('/api/jsData/pool/resource/1')
      .expect(200)
      .end(function (err, res) {
        if(err) {
          done(err);
        }
      });
  });

});
