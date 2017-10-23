const mkdirp = require('mkdirp');
const fs = require('fs');
const events = require('events');

const eventEmitter = new events.EventEmitter();

export {processUpload, eventEmitter, processError};

function processUpload(req, res, next) {

  let folder = './uploads';
  let fileName = req.header('x-file-name');
  let path = req.header('x-file-path');
  let directory = `${folder}/${path}`;
  let sessionID = req.header('x-session-id');

  let filePath = `${directory}/${fileName}`;

  mkdirp(directory, () => {

    let writeStream = fs.createWriteStream(filePath);
    let totalSize = req.header('Content-Length');
    let receivedBytes = 0;
    writeStream.on('finish', () => {
      eventEmitter.emit('uploadSuccess', {filePath : `${req.protocol}://${req.get('host')}${req.originalUrl}/${path}/${fileName}`, sessionID});
      res.status(200).json({message: 'File received'});
    });

    writeStream.on('error', err => {
      writeStream.close();
      next(err);
    });

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      eventEmitter.emit('uploadProgress', {sessionID, totalSize, receivedBytes});
    });

    req.pipe(writeStream);

  });

}

function processError(err, req, res, next) {

  console.log('just error');
  let sessionID = req.header('x-session-id');
  eventEmitter.emit('uploadError', {sessionID, error: err});

  let timestamp = Date.now();
  console.log(timestamp + ' error: %s', err);
  timestamp = Date.now();
  console.log(timestamp + ' error: %s', err.stack);
  next(err);

}
