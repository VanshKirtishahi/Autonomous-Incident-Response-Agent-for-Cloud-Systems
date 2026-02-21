import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export function initSocket(callbacks) {
  const socket = io(SOCKET_URL, { 
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  if (callbacks.onIncidentDetected) {
    socket.on('incident:detected', callbacks.onIncidentDetected);
  }
  
  if (callbacks.onIncidentResolved) {
    socket.on('incident:resolved', callbacks.onIncidentResolved);
  }
  
  if (callbacks.onRollbackTriggered) {
    socket.on('rollback:triggered', callbacks.onRollbackTriggered);
  }
  
  if (callbacks.onRollbackCompleted) {
    socket.on('rollback:completed', callbacks.onRollbackCompleted);
  }
  
  if (callbacks.onKnowledgeProposed) {
    socket.on('knowledge:proposed', callbacks.onKnowledgeProposed);
  }
  
  if (callbacks.onNewLog) {
    socket.on('log:new', callbacks.onNewLog);
  }
  
  if (callbacks.onMetricsUpdate) {
    socket.on('metrics:update', callbacks.onMetricsUpdate);
  }
  
  if (callbacks.onIncidentStatus) {
    socket.on('incident:status', callbacks.onIncidentStatus);
  }

  return socket;
}

// Also export a default object if needed
export default {
  initSocket
};