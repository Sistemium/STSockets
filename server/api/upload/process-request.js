const mkdirp = require('mkdirp');
const fs = require('fs');
const events = require('events');

const eventEmitter = new events.EventEmitter();

export {processUpload, eventEmitter};

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

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      eventEmitter.emit('uploadProgress', {sessionID, totalSize, receivedBytes});
      // console.log(`Received ${chunk.length} bytes of data. total ${receivedBytes}`);
    });

    req.pipe(writeStream);

  });

}
