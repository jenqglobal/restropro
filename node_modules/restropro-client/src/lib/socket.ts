import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string, tenantId: string) => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket = null;
  }

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
    socket?.emit('join-tenant', tenantId);
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') return;
  });

  socket.on('connect_error', () => {});

  return socket;
};

export const joinKitchen = (tenantId: string) => {
  socket?.emit('join-kitchen', tenantId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitEvent = (event: string, data: any) => {
  socket?.emit(event, data);
};

export const subscribeToEvent = (event: string, callback: (data: any) => void) => {
  socket?.on(event, callback);
  return () => socket?.off(event, callback);
};