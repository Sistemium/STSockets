import events from 'events';

const eventEmitter = new events.EventEmitter();
const sockets: any[] = [];

eventEmitter.on('drivers:refresh', (drivers: any) => {
  sockets.every((socket: any) => {
    socket.emit('drivers:refresh', drivers);
  });
})

eventEmitter.on('driver:refresh', (driver: any) => {
  sockets.every((socket: any) => {
    socket.emit('driver:refresh', driver);
  });
});

export function unRegister(socket: any) {
  const idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
}

export function register(socket: any) {
  sockets.push(socket);
  socket.on('disconnect', () => {
    unRegister(socket);
  });
}

export function driversRefresh(drivers: any) {
  eventEmitter.emit('drivers:refresh', drivers);
}

export function driverRefresh(driver: any) {
  eventEmitter.emit('driver:refresh', driver);
}
