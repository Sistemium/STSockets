'use strict';

var dynamoose = require('dynamoose'),
   Schema = dynamoose.Schema;

var StatusSchema = new Schema({
  xid: {
    type: String,
    hashKey: true
  },
  token: String,
  userId: String,
  url: String,
  date: Date
});

module.exports = dynamoose.model('Status', StatusSchema);
