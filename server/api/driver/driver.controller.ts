import * as socket from './driver.socket';

export function driversRefresh(req: any, res: any) {
  socket.driversRefresh(req.body);
  return res.json(200, { message: 'Socket has been synced' });
}

export function driverRefresh(req: any, res: any) {
  socket.driverRefresh(req.body);
  return res.json(200, { message: 'Socket has been synced' });
}
