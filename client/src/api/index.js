// client/src/api/index.js

import { API_URL } from '../utils/constants';

export async function createRoom() {
  const res = await fetch(`${API_URL}/api/rooms`, { method: 'POST' });
  return res.json();
}

export async function checkRoom(roomId) {
  const res = await fetch(`${API_URL}/api/rooms/${roomId}`);
  if (res.status === 404) return null;
  return res.json();
}

export async function loadMessages(roomId, cursor) {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.set('cursor', cursor);
  
  const res = await fetch(`${API_URL}/api/rooms/${roomId}/messages?${params}`);
  return res.json();
}

export async function loadHistory(roomId, cursor) {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.set('cursor', String(cursor));
  
  const res = await fetch(`${API_URL}/api/rooms/${roomId}/history?${params}`);
  return res.json();
}