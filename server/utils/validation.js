// server/utils/validation.js

export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, type: 'unknown', url };
  }

  url = url.trim();

  // YouTube
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        valid: true,
        type: 'youtube',
        videoId: match[1],
        url: url,
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
      };
    }
  }

  // VK Video
  const vkPatterns = [
    /vk\.com\/video(-?\d+_\d+)/,
    /vk\.com\/clip(-?\d+_\d+)/,
    /vk\.com\/video_ext\.php/,
  ];
  
  for (const pattern of vkPatterns) {
    if (pattern.test(url)) {
      return {
        valid: true,
        type: 'vk',
        url: url,
      };
    }
  }

  // Rutube
  const rutubePatterns = [
    /rutube\.ru\/video\/([a-f0-9]+)/,
    /rutube\.ru\/play\/embed\/([a-f0-9]+)/,
  ];
  
  for (const pattern of rutubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        valid: true,
        type: 'rutube',
        videoId: match[1],
        url: url,
        embedUrl: `https://rutube.ru/play/embed/${match[1]}`,
      };
    }
  }

  return { valid: false, type: 'unknown', url };
}

export function validateUserName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}