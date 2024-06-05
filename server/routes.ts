export default function(app: any) {

  app.use('/api/drivers', require('./api/driver').default);
  app.use('/api/remoteCommands', require('./api/remoteCommands').default);
  app.use('/api/remoteRequests', require('./api/remoteRequests').default);
  app.use('/api/sockets', require('./api/session').default);
  app.use('/api/session', require('./api/session').default);
  app.use('/api/jsData', require('./api/jsData').default);
  app.use('/api/msg', require('./api/msg').default);

  app.route('/*')
    .get((req: any, res: any) => {
      res.sendStatus(404);
    });

};
