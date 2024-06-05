import * as socket from './remoteCommands.socket';

export function pushCommand(req: any, res: any) {

  const { deviceUUID } = req.params;
  const count = socket.pushCommand(deviceUUID, req.body);

  if (count) {
    return res.json({ message: 'OK', count: count });
  } else {
    return res.status(404).json({ error: 'device not connected' });
  }

}

export function deviceUUIDRequiredError(req: any, res: any) {
  return res.status(404).json({ error: 'deviceUUID is required' });
}

export function list(req: any, res: any) {
  return res.json(socket.list());
}
