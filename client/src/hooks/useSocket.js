// client/src/hooks/useSocket.js

import { useCallback } from 'react';
import { io } from 'socket.io-client';
import { WS_URL } from '../utils/constants';
import { useRoomStore } from '../stores/useRoomStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useChatStore } from '../stores/useChatStore';
import { usePlaylistStore } from '../stores/usePlaylistStore';
import { toast } from 'sonner';

let globalSocket = null;

export function useSocket() {

  const connect = useCallback(() => {
    if (globalSocket?.connected) {
      return globalSocket;
    }

    if (globalSocket) {
      globalSocket.removeAllListeners();
      globalSocket.disconnect();
      globalSocket = null;
    }

    console.log('[Socket] Creating new connection to', WS_URL);

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      useRoomStore.getState().setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      useRoomStore.getState().setConnected(false);
      if (reason !== 'io client disconnect') {
        toast.error('Соединение потеряно...');
      }
    });

    // === ROOM ===
    socket.on('room:state', ({ room, video, messages, playlist }) => {
      console.log('[Socket] ======= room:state received =======');
      console.log('[Socket] room.users:', room.users);
      console.log('[Socket] video:', JSON.stringify(video));
      
      // Обновить пользователей
      useRoomStore.getState().setUsers(room.users);
      
      // Обновить видео если есть URL
      if (video && video.url) {
        console.log('[Socket] Setting video URL:', video.url);
        console.log('[Socket] Setting video currentTime:', video.currentTime);
        console.log('[Socket] Setting video isPlaying:', video.isPlaying);
        
        useVideoStore.getState().setVideo({
          url: video.url,
          title: video.title || null,
          source: video.source || null,
          currentTime: video.currentTime || 0,
          isPlaying: video.isPlaying || false,
        });
        
        // Проверим что установилось
        setTimeout(() => {
          console.log('[Socket] After setVideo, store.url =', useVideoStore.getState().url);
        }, 50);
      } else {
        console.log('[Socket] No video URL in room:state');
      }
      
      if (messages) {
        console.log('[Socket] Setting', messages.length, 'messages');
        useChatStore.getState().setMessages(messages);
      }
      
      if (playlist) {
        console.log('[Socket] Setting', playlist.length, 'playlist items');
        usePlaylistStore.getState().setItems(playlist);
      }
    });

    socket.on('room:userJoined', ({ userName }) => {
      console.log('[Socket] User joined:', userName);
      useRoomStore.getState().addUser(userName);
      toast.success(`${userName} присоединился`);
    });

    socket.on('room:userLeft', ({ userName }) => {
      console.log('[Socket] User left:', userName);
      useRoomStore.getState().removeUser(userName);
      toast(`${userName} отключился`);
    });

    socket.on('room:full', () => {
      console.log('[Socket] Room is full');
    });
    
    socket.on('room:notFound', () => {
      console.log('[Socket] Room not found');
    });

    socket.on('room:error', ({ message }) => {
      toast.error(message);
    });

    // === VIDEO ===
    socket.on('video:play', ({ time, userName }) => {
      console.log(`[Socket] Remote PLAY from ${userName} at ${time}`);
      useVideoStore.getState().remotePlay(time);
    });

    socket.on('video:pause', ({ time, userName }) => {
      console.log(`[Socket] Remote PAUSE from ${userName} at ${time}`);
      useVideoStore.getState().remotePause(time);
    });

    socket.on('video:seek', ({ time, userName }) => {
      console.log(`[Socket] Remote SEEK from ${userName} to ${time}`);
      useVideoStore.getState().remoteSeek(time);
    });

    socket.on('video:changed', ({ url, title, source }) => {
      console.log('[Socket] video:changed:', url);
      useVideoStore.getState().setVideo({
        url, title, source, currentTime: 0, isPlaying: true,
      });
    });

    socket.on('video:speedChanged', ({ speed }) => {
      useVideoStore.getState().setSpeed(speed);
    });

    socket.on('video:peerBuffering', ({ userName, isBuffering }) => {
      useVideoStore.getState().setPeerBuffering(isBuffering, userName);
    });

    // === CHAT ===
    socket.on('chat:message', (message) => {
      useChatStore.getState().addMessage(message);
    });

    socket.on('chat:reaction', ({ messageId, userName, emoji, action }) => {
      if (action === 'add') {
        useChatStore.getState().addReaction(messageId, userName, emoji);
      } else {
        useChatStore.getState().removeReaction(messageId, userName, emoji);
      }
    });

    // === PLAYLIST ===
    socket.on('playlist:updated', ({ playlist }) => {
      usePlaylistStore.getState().setItems(playlist);
    });

    globalSocket = socket;
    return socket;
  }, []);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.removeAllListeners();
      globalSocket.disconnect();
      globalSocket = null;
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (globalSocket?.connected) {
      globalSocket.emit(event, data);
    } else {
      console.warn('[Socket] Not connected, cannot emit:', event);
    }
  }, []);

  return { connect, disconnect, emit };
}