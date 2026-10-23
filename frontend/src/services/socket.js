import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (onNotificationReceived) => {
  const token = getAccessToken();
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(socketURL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['polling', 'websocket'],
  });

  socket.on('connect', () => {
    // Connected to SecureBank real-time notification gateway
  });

  socket.on('notification', (data) => {
    if (onNotificationReceived && typeof onNotificationReceived === 'function') {
      onNotificationReceived(data);
    }
  });

  socket.on('connect_error', () => {
    // Realtime connection attempt failure (fallback handled gracefully)
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
