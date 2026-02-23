// client/src/utils/constants.js

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const QUICK_REACTIONS = ['😂', '❤️', '👍', '👎', '😮', '🔥'];

export const SOURCE_COLORS = {
  youtube: '#ff0000',
  vk: '#0077ff',
  rutube: '#00c8aa',
};

export const SOURCE_LABELS = {
  youtube: 'YouTube',
  vk: 'VK',
  rutube: 'Rutube',
};