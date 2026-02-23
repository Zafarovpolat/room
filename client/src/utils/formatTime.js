// client/src/utils/formatTime.js

export function formatVideoTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatMessageTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateGroup(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const dayMs = 86400000;

  if (diff < dayMs && date.getDate() === now.getDate()) return 'Сегодня';
  if (diff < 2 * dayMs) return 'Вчера';
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}