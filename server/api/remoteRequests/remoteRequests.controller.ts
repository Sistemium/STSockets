import * as socket from '../remoteCommands/remoteCommands.socket';

export async function pushRequest(req: any, res: any) {

  const deviceUUID = req.params.deviceUUID;

  return socket.pushRequest(deviceUUID, req.body).then(response => {
    return res.json(response);
  }).catch(error => {
    return res.status(404).json({ error });
  });

}

export function deviceUUIDRequiredError(req: any, res: any) {
  return res.status(404).json({ error: 'deviceUUID is required' });
}

export function list(req: any, res: any) {
  return res.json(socket.list());
}
