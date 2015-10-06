'use strict';

var dynamoose = require('dynamoose'),
   Schema = dynamoose.Schema;

var StatusSchema = new Schema({
  xid: {
    type: String,
    hashKey: true
  },
  url: String,
  time: Date
});

module.exports = dynamoose.model('Status', StatusSchema);
